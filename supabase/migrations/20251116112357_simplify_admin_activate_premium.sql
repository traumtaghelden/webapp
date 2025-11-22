/*
  # Simplify Admin Premium Activation

  1. Updates
    - Remove references to non-existent weddings columns
    - Only update user_profiles table
    - Use correct column names (id instead of user_id for user_profiles)

  2. Security
    - Maintains admin-only access
    - Logs all actions to audit log
*/

-- Drop old function
DROP FUNCTION IF EXISTS admin_activate_premium(uuid, text);

-- Create simplified admin_activate_premium
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

-- Add comment
COMMENT ON FUNCTION admin_activate_premium IS 'Manually activate premium for a user (new simplified system)';
