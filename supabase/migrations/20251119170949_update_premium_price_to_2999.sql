/*
  # Update Premium Price to 29.99€

  1. Changes
    - Update get_user_stats function to use 29.99€ price
    - Update MRR calculation to reflect new pricing

  2. Purpose
    - Adjust pricing from 49.99€ to 29.99€ per month
    - Update admin dashboard statistics
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_stats();

-- Recreate function with updated price
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_price numeric := 29.99; -- Premium price per month (updated to 29.99€)
BEGIN
  SELECT json_build_object(
    'total_users', COUNT(*),
    'trial_active', COUNT(*) FILTER (WHERE account_status = 'trial_active'),
    'premium_active', COUNT(*) FILTER (WHERE account_status = 'premium_active'),
    'trial_ended', COUNT(*) FILTER (WHERE account_status = 'trial_ended'),
    'read_only', COUNT(*) FILTER (WHERE account_status = 'read_only'),
    'scheduled_deletion', COUNT(*) FILTER (WHERE account_status = 'scheduled_deletion'),
    'mrr', (COUNT(*) FILTER (WHERE account_status = 'premium_active') * v_price)
  )
  INTO v_result
  FROM user_profiles;

  RETURN v_result;
END;
$$;
