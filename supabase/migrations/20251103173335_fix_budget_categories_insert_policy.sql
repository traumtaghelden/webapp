/*
  # Fix Budget Categories INSERT Policy
  
  1. Changes
    - Fix the restrictive policy self-reference bug
    - Correctly count existing categories for the wedding being inserted into
  
  2. Security
    - Free users: up to 6 categories per wedding
    - Premium users: unlimited categories
*/

-- Drop the broken restrictive policy
DROP POLICY IF EXISTS "budget_categories_insert_limit_check" ON budget_categories;

-- Create corrected restrictive policy
CREATE POLICY "budget_categories_insert_limit_check"
  ON budget_categories
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Premium users have no limit
    (EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.subscription_tier = 'premium'
    ))
    OR
    -- Free users can create up to 6 categories per wedding
    (
      (SELECT COUNT(*) 
       FROM budget_categories bc
       WHERE bc.wedding_id = budget_categories.wedding_id) < 6
    )
  );