/*
  # Fix admin functions to use correct user_id column

  1. Changes
    - Fix `admin_activate_premium`: use `user_id` instead of `id`
    - Fix `admin_set_account_status`: use `user_id` instead of `id` in all places
    - Fix admin check to use `user_id` instead of `id`
  
  2. Impact
    - All admin functions will now work correctly
    - check_trial_status will work (depends on these)
*/

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

  -- Activate premium in user_profiles
  UPDATE user_profiles
  SET account_status = 'premium_active',
      premium_since = COALESCE(premium_since, now()),
      data_deletion_scheduled_at = NULL,
      subscription_cancelled_at = NULL,
      updated_at = now()
  WHERE user_id = p_user_id;  -- FIXED: was 'id'

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
  -- Check if caller is admin (FIXED: use user_id instead of id)
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()  -- FIXED: was 'id'
      AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Validate status
  IF p_status NOT IN ('trial_active', 'trial_ended', 'premium_active', 'premium_cancelled', 'grace_period', 'pending_deletion') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Get current status (FIXED: use user_id instead of id)
  SELECT account_status INTO v_old_status
  FROM user_profiles
  WHERE user_id = p_user_id;  -- FIXED: was 'id'

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Update status (FIXED: use user_id instead of id)
  UPDATE user_profiles
  SET 
    account_status = p_status::account_status_type,
    updated_at = now()
  WHERE user_id = p_user_id;  -- FIXED: was 'id'

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