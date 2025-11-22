/*
  # Fix get_user_stats to include grace_period_users

  1. Changes
    - Add grace_period_users count to return object
    - Ensure all account_status values are counted

  2. Purpose
    - Fix Dashboard display issue
    - Provide complete user statistics
*/

-- Drop and recreate get_user_stats function with grace_period_users
DROP FUNCTION IF EXISTS get_user_stats();

CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_price numeric := 29.99; -- Premium price per month
BEGIN
  SELECT json_build_object(
    'total_users', COUNT(*),
    'trial_active', COUNT(*) FILTER (WHERE account_status = 'trial_active'),
    'premium_active', COUNT(*) FILTER (WHERE account_status = 'premium_active'),
    'trial_expired', COUNT(*) FILTER (WHERE account_status = 'trial_expired'),
    'premium_cancelled', COUNT(*) FILTER (WHERE account_status = 'premium_cancelled'),
    'suspended', COUNT(*) FILTER (WHERE account_status = 'suspended'),
    'deleted', COUNT(*) FILTER (WHERE account_status = 'deleted'),
    'grace_period_users', COUNT(*) FILTER (WHERE account_status = 'grace_period'),
    'mrr', (COUNT(*) FILTER (WHERE account_status = 'premium_active') * v_price)
  )
  INTO v_result
  FROM user_profiles;

  RETURN v_result;
END;
$$;
