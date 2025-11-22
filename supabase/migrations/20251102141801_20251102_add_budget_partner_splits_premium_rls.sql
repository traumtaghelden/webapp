/*
  # Add Premium RLS Policies for Budget Partner Splits

  1. Security Changes
    - Add RESTRICTIVE policies to budget_partner_splits table
    - Prevent Free users from creating, updating, or deleting cost splits
    - Only allow Premium users to manage cost splits
    - Maintain read access for all authenticated users who own the budget item

  2. Important Notes
    - Uses RESTRICTIVE policies to ensure enforcement even if permissive policies exist
    - Checks subscription_tier from user_profiles table
    - Prevents API bypass attempts by Free users
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "budget_partner_splits_insert_premium_only" ON budget_partner_splits;
DROP POLICY IF EXISTS "budget_partner_splits_update_premium_only" ON budget_partner_splits;
DROP POLICY IF EXISTS "budget_partner_splits_delete_premium_only" ON budget_partner_splits;

-- Restrictive policy: Only Premium users can INSERT cost splits
CREATE POLICY "budget_partner_splits_insert_premium_only"
ON budget_partner_splits AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Restrictive policy: Only Premium users can UPDATE cost splits
CREATE POLICY "budget_partner_splits_update_premium_only"
ON budget_partner_splits AS RESTRICTIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Restrictive policy: Only Premium users can DELETE cost splits
CREATE POLICY "budget_partner_splits_delete_premium_only"
ON budget_partner_splits AS RESTRICTIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);
