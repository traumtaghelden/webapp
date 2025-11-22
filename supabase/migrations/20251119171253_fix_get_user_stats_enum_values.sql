/*
  # Fix get_user_stats Function - Use Correct Enum Values

  1. Changes
    - Update get_user_stats to use correct enum values
    - Replace 'trial_ended' with 'trial_expired'
    - Replace 'read_only' and 'scheduled_deletion' with correct enums

  2. Purpose
    - Fix 400 errors caused by invalid enum values
    - Align function with actual database enum type
*/

-- Drop and recreate get_user_stats function with correct enum values
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
    'mrr', (COUNT(*) FILTER (WHERE account_status = 'premium_active') * v_price)
  )
  INTO v_result
  FROM user_profiles;

  RETURN v_result;
END;
$$;
