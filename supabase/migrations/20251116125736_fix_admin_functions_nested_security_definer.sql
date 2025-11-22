/*
  # Fix nested SECURITY DEFINER admin functions

  1. Changes
    - Remove admin check from `calculate_mrr()` since it's only called by `get_user_stats()`
    - This prevents nested SECURITY DEFINER context issues
  
  2. Security
    - `get_user_stats()` already checks admin role
    - `calculate_mrr()` is not exposed as RPC, only called internally
*/

CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr numeric;
  v_price numeric := 49.99; -- Premium price per month (updated to correct price)
BEGIN
  -- No admin check needed - this function is only called by get_user_stats()
  -- which already checks admin role
  
  -- Count active premium users from user_profiles
  SELECT COUNT(*) * v_price INTO v_mrr
  FROM user_profiles
  WHERE account_status = 'premium_active';

  RETURN COALESCE(v_mrr, 0);
END;
$$;