/*
  # Fix all functions that use wrong column name for user lookup

  1. Changes
    - Fix `get_user_subscription_tier`: use `user_id` instead of `id`
    - All other functions that depend on this will now work correctly
  
  2. Impact
    - check_trial_status will work
    - All limit validation functions will work
    - Subscription checks will work
*/

-- Fix get_user_subscription_tier function
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
  WHERE user_id = p_user_id;  -- FIXED: was 'id', now 'user_id'
  
  RETURN COALESCE(v_tier, 'free');
END;
$$;