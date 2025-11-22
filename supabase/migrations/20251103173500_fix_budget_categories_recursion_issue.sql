/*
  # Fix Budget Categories Infinite Recursion Issue
  
  1. Changes
    - Remove the problematic restrictive policy that causes infinite recursion
    - Use a simpler approach with a function to check the limit
  
  2. Security
    - Free users: up to 6 categories per wedding
    - Premium users: unlimited categories
*/

-- Drop the broken restrictive policy
DROP POLICY IF EXISTS "budget_categories_insert_limit_check" ON budget_categories;

-- Create a function to check if user can insert category
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
  -- Check if user is premium
  SELECT subscription_tier = 'premium' INTO v_is_premium
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Premium users have no limit
  IF v_is_premium THEN
    RETURN true;
  END IF;
  
  -- Count existing categories for this wedding
  SELECT COUNT(*) INTO v_category_count
  FROM budget_categories
  WHERE wedding_id = p_wedding_id;
  
  -- Free users can have up to 6 categories
  RETURN v_category_count < 6;
END;
$$;

-- Create new restrictive policy using the function
CREATE POLICY "budget_categories_insert_limit_check"
  ON budget_categories
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    check_budget_category_limit(wedding_id)
  );