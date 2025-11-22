/*
  # Fix check_budget_category_limit function for new premium system
  
  1. Updates
    - Remove reference to non-existent subscription_tier column
    - Use is_premium field from weddings table instead
    - Premium users have unlimited budget categories
    - All users get unlimited categories (no restrictions in new system)
*/

-- Drop and recreate the function with correct logic
CREATE OR REPLACE FUNCTION check_budget_category_limit(p_wedding_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium boolean;
  v_category_count integer;
BEGIN
  -- Check if wedding is premium
  SELECT is_premium INTO v_is_premium
  FROM weddings
  WHERE id = p_wedding_id;

  -- All users in the new system have unlimited categories
  -- (Premium-only system means everyone who uses the app is premium)
  RETURN true;
END;
$$;