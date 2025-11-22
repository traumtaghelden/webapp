/*
  # Revert all functions to use correct 'id' column

  1. Changes
    - Revert `get_account_status`: use `id` instead of `user_id`
    - Revert `get_user_subscription_tier`: use `id` instead of `user_id`
    - Revert `admin_activate_premium`: use `id` instead of `user_id`
    - Revert `admin_set_account_status`: use `id` instead of `user_id`
  
  2. Root Cause
    - user_profiles table uses 'id' as the column name (references auth.users(id))
    - All previous migrations incorrectly changed to 'user_id'
*/

-- Fix get_account_status
CREATE OR REPLACE FUNCTION get_account_status(p_user_id uuid)
RETURNS account_status_type
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_status account_status_type;
  v_trial_ends_at timestamptz;
  v_stripe_customer_id text;
  v_has_active_subscription boolean;
BEGIN
  -- Get user profile data (use 'id' column)
  SELECT 
    account_status, 
    trial_ends_at,
    stripe_customer_id
  INTO 
    v_account_status, 
    v_trial_ends_at,
    v_stripe_customer_id
  FROM user_profiles
  WHERE id = p_user_id;  -- CORRECT: use 'id'

  -- Priority 1: Respect manually set premium_active status (admin override)
  IF v_account_status = 'premium_active' THEN
    RETURN 'premium_active'::account_status_type;
  END IF;

  -- Priority 2: Check for active Stripe subscription
  IF v_stripe_customer_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 
      FROM stripe_subscriptions
      WHERE customer_id = v_stripe_customer_id
        AND status = 'active'
    ) INTO v_has_active_subscription;

    IF v_has_active_subscription THEN
      RETURN 'premium_active'::account_status_type;
    END IF;
  END IF;

  -- Priority 3: Check trial period
  IF v_trial_ends_at > now() THEN
    RETURN 'trial_active'::account_status_type;
  END IF;

  -- Priority 4: Return stored status
  RETURN v_account_status;
END;
$$;

-- Fix get_user_subscription_tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT subscription_tier INTO v_tier
  FROM user_profiles
  WHERE id = p_user_id;  -- CORRECT: use 'id'
  
  RETURN COALESCE(v_tier, 'free');
END;
$$;

-- Fix admin_activate_premium
CREATE OR REPLACE FUNCTION admin_activate_premium(p_user_id uuid, p_reason text)
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

  -- Activate premium in user_profiles (use 'id' column)
  UPDATE user_profiles
  SET account_status = 'premium_active',
      premium_since = COALESCE(premium_since, now()),
      data_deletion_scheduled_at = NULL,
      subscription_cancelled_at = NULL,
      updated_at = now()
  WHERE id = p_user_id;  -- CORRECT: use 'id'

  -- Log action
  PERFORM log_admin_action(
    'premium_activated',
    p_user_id,
    jsonb_build_object('reason', p_reason, 'method', 'manual')
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Fix admin_set_account_status
CREATE OR REPLACE FUNCTION admin_set_account_status(p_user_id uuid, p_status text, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
BEGIN
  -- Check if caller is admin (use 'id' column)
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()  -- CORRECT: use 'id'
      AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Validate status
  IF p_status NOT IN ('trial_active', 'trial_ended', 'premium_active', 'premium_cancelled', 'grace_period', 'pending_deletion') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Get current status (use 'id' column)
  SELECT account_status INTO v_old_status
  FROM user_profiles
  WHERE id = p_user_id;  -- CORRECT: use 'id'

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Update status (use 'id' column)
  UPDATE user_profiles
  SET 
    account_status = p_status::account_status_type,
    updated_at = now()
  WHERE id = p_user_id;  -- CORRECT: use 'id'

  -- Log action
  INSERT INTO admin_audit_log (admin_id, action_type, target_user_id, details)
  VALUES (
    auth.uid(),
    'account_status_changed',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'old_status', v_old_status,
      'new_status', p_status
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_status
  );
END;
$$;