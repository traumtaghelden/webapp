/*
  # Create Admin Helper Functions

  1. Helper Functions
    - `is_admin()` - Check if current user is admin
    - `get_trial_status(user_id)` - Get trial status and remaining days
    - `calculate_mrr()` - Calculate Monthly Recurring Revenue
    - `get_conversion_rate(start_date, end_date)` - Calculate trial to premium conversion rate
    - `get_user_stats()` - Get comprehensive user statistics
    - `log_admin_action()` - Helper to log admin actions

  2. Security
    - All functions use SECURITY DEFINER with proper checks
    - Functions validate admin role before executing
*/

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_role = 'admin'
  );
END;
$$;

-- Function: Get trial status for a user
CREATE OR REPLACE FUNCTION get_trial_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wedding record;
  v_result jsonb;
  v_days_remaining int;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT * INTO v_wedding
  FROM weddings
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_wedding IS NULL THEN
    RETURN jsonb_build_object(
      'has_trial', false,
      'is_active', false,
      'days_remaining', 0,
      'trial_start', null,
      'trial_end', null
    );
  END IF;

  v_days_remaining := EXTRACT(DAY FROM (v_wedding.trial_end - now()));

  RETURN jsonb_build_object(
    'has_trial', true,
    'is_active', now() < v_wedding.trial_end,
    'days_remaining', v_days_remaining,
    'trial_start', v_wedding.trial_start,
    'trial_end', v_wedding.trial_end
  );
END;
$$;

-- Function: Calculate Monthly Recurring Revenue
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr numeric;
  v_price numeric := 9.99; -- Premium price per month
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Count active premium users
  SELECT COUNT(*) * v_price INTO v_mrr
  FROM weddings
  WHERE is_premium = true
  AND (premium_expires_at IS NULL OR premium_expires_at > now());

  RETURN COALESCE(v_mrr, 0);
END;
$$;

-- Function: Get conversion rate
CREATE OR REPLACE FUNCTION get_conversion_rate(
  p_start_date timestamptz DEFAULT (now() - interval '30 days'),
  p_end_date timestamptz DEFAULT now()
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_trials int;
  v_conversions int;
  v_rate numeric;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Count trials that started in the period
  SELECT COUNT(*) INTO v_total_trials
  FROM weddings
  WHERE trial_start >= p_start_date
  AND trial_start <= p_end_date;

  -- Count conversions (trials that became premium)
  SELECT COUNT(*) INTO v_conversions
  FROM weddings w
  WHERE w.trial_start >= p_start_date
  AND w.trial_start <= p_end_date
  AND w.is_premium = true;

  IF v_total_trials = 0 THEN
    RETURN 0;
  END IF;

  v_rate := (v_conversions::numeric / v_total_trials::numeric) * 100;
  RETURN ROUND(v_rate, 2);
END;
$$;

-- Function: Get comprehensive user statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
  v_total_users int;
  v_active_trials int;
  v_premium_users int;
  v_grace_period_users int;
  v_new_today int;
  v_mrr numeric;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Total users
  SELECT COUNT(*) INTO v_total_users FROM user_profiles;

  -- Active trials
  SELECT COUNT(*) INTO v_active_trials
  FROM weddings
  WHERE trial_end > now()
  AND (NOT is_premium OR is_premium IS NULL);

  -- Premium users
  SELECT COUNT(*) INTO v_premium_users
  FROM weddings
  WHERE is_premium = true
  AND (premium_expires_at IS NULL OR premium_expires_at > now());

  -- Grace period users
  SELECT COUNT(*) INTO v_grace_period_users
  FROM weddings
  WHERE grace_period_ends_at IS NOT NULL
  AND grace_period_ends_at > now();

  -- New users today
  SELECT COUNT(*) INTO v_new_today
  FROM user_profiles
  WHERE DATE(created_at) = CURRENT_DATE;

  -- MRR
  v_mrr := calculate_mrr();

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'active_trials', v_active_trials,
    'premium_users', v_premium_users,
    'grace_period_users', v_grace_period_users,
    'new_today', v_new_today,
    'mrr', v_mrr
  );
END;
$$;

-- Function: Log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type text,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  INSERT INTO admin_audit_log (admin_id, action_type, target_user_id, details)
  VALUES (auth.uid(), p_action_type, p_target_user_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function: Extend trial
CREATE OR REPLACE FUNCTION admin_extend_trial(
  p_user_id uuid,
  p_days int,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wedding record;
  v_new_trial_end timestamptz;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get wedding
  SELECT * INTO v_wedding
  FROM weddings
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_wedding IS NULL THEN
    RAISE EXCEPTION 'No wedding found for user';
  END IF;

  -- Calculate new trial end
  v_new_trial_end := GREATEST(v_wedding.trial_end, now()) + (p_days || ' days')::interval;

  -- Update trial end
  UPDATE weddings
  SET trial_end = v_new_trial_end,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'trial_extended',
    p_user_id,
    jsonb_build_object(
      'days', p_days,
      'reason', p_reason,
      'old_trial_end', v_wedding.trial_end,
      'new_trial_end', v_new_trial_end
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_trial_end', v_new_trial_end
  );
END;
$$;

-- Function: Activate premium manually
CREATE OR REPLACE FUNCTION admin_activate_premium(
  p_user_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Activate premium
  UPDATE weddings
  SET is_premium = true,
      premium_activated_at = now(),
      premium_expires_at = NULL, -- No expiry for manual activation
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'premium_activated',
    p_user_id,
    jsonb_build_object('reason', p_reason, 'method', 'manual')
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Deactivate premium
CREATE OR REPLACE FUNCTION admin_deactivate_premium(
  p_user_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Deactivate premium (set expiry to now)
  UPDATE weddings
  SET premium_expires_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'premium_deactivated',
    p_user_id,
    jsonb_build_object('reason', p_reason)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Cancel deletion
CREATE OR REPLACE FUNCTION admin_cancel_deletion(
  p_user_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Cancel deletion by removing grace period
  UPDATE weddings
  SET grace_period_ends_at = NULL,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'deletion_cancelled',
    p_user_id,
    jsonb_build_object('reason', p_reason)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Extend grace period
CREATE OR REPLACE FUNCTION admin_extend_grace_period(
  p_user_id uuid,
  p_days int,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wedding record;
  v_new_grace_end timestamptz;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get wedding
  SELECT * INTO v_wedding
  FROM weddings
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_wedding IS NULL THEN
    RAISE EXCEPTION 'No wedding found for user';
  END IF;

  -- Calculate new grace period end
  v_new_grace_end := GREATEST(
    COALESCE(v_wedding.grace_period_ends_at, now()),
    now()
  ) + (p_days || ' days')::interval;

  -- Update grace period
  UPDATE weddings
  SET grace_period_ends_at = v_new_grace_end,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'grace_period_extended',
    p_user_id,
    jsonb_build_object(
      'days', p_days,
      'reason', p_reason,
      'old_grace_end', v_wedding.grace_period_ends_at,
      'new_grace_end', v_new_grace_end
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_grace_period_end', v_new_grace_end
  );
END;
$$;