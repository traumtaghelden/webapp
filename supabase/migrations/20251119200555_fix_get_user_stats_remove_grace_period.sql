/*
  # Fix get_user_stats - Remove invalid grace_period enum value

  1. Changes
    - Remove grace_period filter (not a valid enum value)
    - Set grace_period_users to 0 for now (can be computed differently if needed)

  2. Purpose
    - Fix 400 Bad Request error in Dashboard
    - Ensure function uses only valid enum values
*/

-- Drop and recreate get_user_stats function without grace_period
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
    'grace_period_users', 0,
    'mrr', (COUNT(*) FILTER (WHERE account_status = 'premium_active') * v_price)
  )
  INTO v_result
  FROM user_profiles;

  RETURN v_result;
END;
$$;
