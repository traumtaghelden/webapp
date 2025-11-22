/*
  # Fix get_user_stats to use correct enum values

  1. Changes
    - Replace 'pending_deletion' with 'deleted'
    - Replace 'grace_period' with 'suspended'
    - Replace 'trial_ended' with 'trial_expired'
  
  2. Notes
    - These match the actual account_status_type enum values
*/

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
  v_pending_deletion int;
  v_grace_period int;
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
  WHERE account_status = 'trial_active'
    AND trial_ends_at > now();

  -- Premium users
  SELECT COUNT(*) INTO v_premium_users
  FROM user_profiles
  WHERE account_status = 'premium_active';

  -- Cancelled users
  SELECT COUNT(*) INTO v_cancelled_users
  FROM user_profiles
  WHERE account_status = 'premium_cancelled';

  -- Pending deletion users (using 'deleted' status)
  SELECT COUNT(*) INTO v_pending_deletion
  FROM user_profiles
  WHERE account_status = 'deleted';

  -- Grace period users (using 'suspended' status)
  SELECT COUNT(*) INTO v_grace_period
  FROM user_profiles
  WHERE account_status = 'suspended';

  -- Trial ended users (using 'trial_expired' status)
  SELECT COUNT(*) INTO v_suspended_users
  FROM user_profiles
  WHERE account_status = 'trial_expired';

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
    'pending_deletion', v_pending_deletion,
    'grace_period', v_grace_period,
    'new_today', v_new_today,
    'mrr', v_mrr
  );
END;
$$;