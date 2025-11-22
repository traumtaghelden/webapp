/*
  # Fix Admin Functions for New Premium System

  1. Problem
    - Admin functions still reference old columns (is_premium, premium_expires_at) in weddings table
    - New system uses user_profiles with account_status enum
    - Functions need to be updated to work with new schema

  2. Changes
    - Update all admin helper functions to use user_profiles instead of weddings
    - Fix calculate_mrr() to count premium_active users
    - Fix get_user_stats() to use account_status
    - Fix admin_activate_premium() to set account_status
    - Fix admin_deactivate_premium() to set account_status
    - Remove references to non-existent columns

  3. New Schema Reference
    - user_profiles.account_status: 'trial', 'premium_active', 'premium_cancelled', 'suspended', 'free'
    - user_profiles.premium_since: timestamp when premium was activated
    - user_profiles.trial_ends_at: trial expiration date
*/

-- Function: Calculate Monthly Recurring Revenue (Fixed)
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

  -- Count active premium users from user_profiles
  SELECT COUNT(*) * v_price INTO v_mrr
  FROM user_profiles
  WHERE account_status = 'premium_active';

  RETURN COALESCE(v_mrr, 0);
END;
$$;

-- Function: Get conversion rate (Fixed)
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
  FROM user_profiles
  WHERE trial_started_at >= p_start_date
  AND trial_started_at <= p_end_date;

  -- Count conversions (trials that became premium)
  SELECT COUNT(*) INTO v_conversions
  FROM user_profiles
  WHERE trial_started_at >= p_start_date
  AND trial_started_at <= p_end_date
  AND account_status = 'premium_active';

  IF v_total_trials = 0 THEN
    RETURN 0;
  END IF;

  v_rate := (v_conversions::numeric / v_total_trials::numeric) * 100;
  RETURN ROUND(v_rate, 2);
END;
$$;

-- Function: Get comprehensive user statistics (Fixed)
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
  v_cancelled_users int;
  v_suspended_users int;
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
  FROM user_profiles
  WHERE account_status = 'trial'
  AND trial_ends_at > now();

  -- Premium users
  SELECT COUNT(*) INTO v_premium_users
  FROM user_profiles
  WHERE account_status = 'premium_active';

  -- Cancelled users (with data deletion scheduled)
  SELECT COUNT(*) INTO v_cancelled_users
  FROM user_profiles
  WHERE account_status = 'premium_cancelled'
  AND data_deletion_scheduled_at IS NOT NULL;

  -- Suspended users
  SELECT COUNT(*) INTO v_suspended_users
  FROM user_profiles
  WHERE account_status = 'suspended';

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
    'cancelled_users', v_cancelled_users,
    'suspended_users', v_suspended_users,
    'new_today', v_new_today,
    'mrr', v_mrr
  );
END;
$$;

-- Function: Get trial status for a user (Fixed)
CREATE OR REPLACE FUNCTION get_trial_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile record;
  v_result jsonb;
  v_days_remaining int;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT * INTO v_profile
  FROM user_profiles
  WHERE id = p_user_id
  LIMIT 1;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'has_trial', false,
      'is_active', false,
      'days_remaining', 0,
      'trial_start', null,
      'trial_end', null
    );
  END IF;

  IF v_profile.trial_ends_at IS NULL THEN
    RETURN jsonb_build_object(
      'has_trial', false,
      'is_active', false,
      'days_remaining', 0,
      'trial_start', v_profile.trial_started_at,
      'trial_end', null
    );
  END IF;

  v_days_remaining := EXTRACT(DAY FROM (v_profile.trial_ends_at - now()));

  RETURN jsonb_build_object(
    'has_trial', true,
    'is_active', now() < v_profile.trial_ends_at,
    'days_remaining', v_days_remaining,
    'trial_start', v_profile.trial_started_at,
    'trial_end', v_profile.trial_ends_at
  );
END;
$$;

-- Function: Extend trial (Fixed)
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
  v_profile record;
  v_new_trial_end timestamptz;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get user profile
  SELECT * INTO v_profile
  FROM user_profiles
  WHERE id = p_user_id
  LIMIT 1;

  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'No user profile found';
  END IF;

  -- Calculate new trial end
  v_new_trial_end := GREATEST(
    COALESCE(v_profile.trial_ends_at, now()), 
    now()
  ) + (p_days || ' days')::interval;

  -- Update trial end
  UPDATE user_profiles
  SET trial_ends_at = v_new_trial_end,
      updated_at = now()
  WHERE id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'trial_extended',
    p_user_id,
    jsonb_build_object(
      'days', p_days,
      'reason', p_reason,
      'old_trial_end', v_profile.trial_ends_at,
      'new_trial_end', v_new_trial_end
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_trial_end', v_new_trial_end
  );
END;
$$;

-- Function: Activate premium manually (Fixed)
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

  -- Activate premium in user_profiles
  UPDATE user_profiles
  SET account_status = 'premium_active',
      premium_since = COALESCE(premium_since, now()),
      data_deletion_scheduled_at = NULL,
      subscription_cancelled_at = NULL,
      updated_at = now()
  WHERE id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'premium_activated',
    p_user_id,
    jsonb_build_object('reason', p_reason, 'method', 'manual')
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Deactivate premium (Fixed)
CREATE OR REPLACE FUNCTION admin_deactivate_premium(
  p_user_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deletion_date timestamptz;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Calculate deletion date (30 days from now)
  v_deletion_date := now() + interval '30 days';

  -- Deactivate premium
  UPDATE user_profiles
  SET account_status = 'premium_cancelled',
      subscription_cancelled_at = now(),
      data_deletion_scheduled_at = v_deletion_date,
      updated_at = now()
  WHERE id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'premium_deactivated',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'deletion_scheduled', v_deletion_date
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'deletion_scheduled_at', v_deletion_date
  );
END;
$$;

-- Function: Cancel deletion (Fixed)
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

  -- Cancel deletion by removing scheduled deletion date
  UPDATE user_profiles
  SET data_deletion_scheduled_at = NULL,
      updated_at = now()
  WHERE id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'deletion_cancelled',
    p_user_id,
    jsonb_build_object('reason', p_reason)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Extend grace period (Fixed - now works with data_deletion_scheduled_at)
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
  v_profile record;
  v_new_deletion_date timestamptz;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get user profile
  SELECT * INTO v_profile
  FROM user_profiles
  WHERE id = p_user_id
  LIMIT 1;

  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'No user profile found';
  END IF;

  -- Calculate new deletion date
  v_new_deletion_date := GREATEST(
    COALESCE(v_profile.data_deletion_scheduled_at, now()),
    now()
  ) + (p_days || ' days')::interval;

  -- Update deletion date
  UPDATE user_profiles
  SET data_deletion_scheduled_at = v_new_deletion_date,
      updated_at = now()
  WHERE id = p_user_id;

  -- Log action
  PERFORM log_admin_action(
    'grace_period_extended',
    p_user_id,
    jsonb_build_object(
      'days', p_days,
      'reason', p_reason,
      'old_deletion_date', v_profile.data_deletion_scheduled_at,
      'new_deletion_date', v_new_deletion_date
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_deletion_date', v_new_deletion_date
  );
END;
$$;
