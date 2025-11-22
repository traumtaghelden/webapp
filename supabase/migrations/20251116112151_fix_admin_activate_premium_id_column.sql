/*
  # Fix Admin Premium Activation - Correct Column Names

  1. Updates
    - Fix admin_activate_premium to use 'id' instead of 'user_id' for user_profiles
    - Fix admin_set_account_status to use 'id' instead of 'user_id'
    - Maintain compatibility with weddings table which uses user_id

  2. Security
    - Maintains admin-only access
    - Logs all actions to audit log
*/

-- Drop old functions
DROP FUNCTION IF EXISTS admin_activate_premium(uuid, text);
DROP FUNCTION IF EXISTS admin_set_account_status(uuid, text, text);

-- Create new admin_activate_premium with correct column names
CREATE OR REPLACE FUNCTION admin_activate_premium(
  p_user_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get current status (user_profiles uses 'id' as primary key)
  SELECT account_status INTO v_old_status
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Update to premium_active status
  UPDATE user_profiles
  SET 
    account_status = 'premium_active',
    premium_since = COALESCE(premium_since, now()),
    data_deletion_scheduled_at = NULL,
    subscription_cancelled_at = NULL,
    updated_at = now()
  WHERE id = p_user_id;

  -- Also update weddings table for backward compatibility (weddings uses 'user_id')
  UPDATE weddings
  SET 
    is_premium = true,
    premium_activated_at = COALESCE(premium_activated_at, now()),
    premium_expires_at = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log action
  INSERT INTO admin_audit_log (admin_id, action_type, target_user_id, details)
  VALUES (
    auth.uid(),
    'premium_activated',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'method', 'manual_admin',
      'old_status', v_old_status,
      'new_status', 'premium_active'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', 'premium_active'
  );
END;
$$;

-- Create function to set any account status (for advanced admin use)
CREATE OR REPLACE FUNCTION admin_set_account_status(
  p_user_id uuid,
  p_status text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Validate status
  IF p_status NOT IN ('trial_active', 'trial_expired', 'premium_active', 'premium_cancelled', 'suspended', 'deleted') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Get current status (user_profiles uses 'id')
  SELECT account_status INTO v_old_status
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Update status
  UPDATE user_profiles
  SET 
    account_status = p_status::account_status_type,
    updated_at = now()
  WHERE id = p_user_id;

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

-- Add comments
COMMENT ON FUNCTION admin_activate_premium IS 'Manually activate premium for a user - uses user_profiles.id';
COMMENT ON FUNCTION admin_set_account_status IS 'Set any account status for a user - uses user_profiles.id';
