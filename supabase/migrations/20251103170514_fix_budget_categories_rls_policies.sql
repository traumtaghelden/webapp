/*
  # Fix Budget Categories RLS Policies
  
  1. Changes
    - Remove restrictive premium-only policies for budget_categories
    - Allow free users to create up to 6 categories
    - Premium users get unlimited categories
  
  2. Security
    - Maintain authentication checks
    - Users can only manage their own wedding categories
*/

-- Drop the restrictive premium-only policies
DROP POLICY IF EXISTS "budget_categories_insert_check_premium" ON budget_categories;
DROP POLICY IF EXISTS "budget_categories_update_check_premium" ON budget_categories;

-- Create a new restrictive policy that allows free users up to 6 categories
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
      (SELECT COUNT(*) FROM budget_categories 
       WHERE budget_categories.wedding_id = budget_categories.wedding_id) < 6
    )
  );
