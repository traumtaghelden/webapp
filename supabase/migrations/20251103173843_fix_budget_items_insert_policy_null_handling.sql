/*
  # Fix Budget Items INSERT Policy - NULL Handling
  
  1. Changes
    - Update restrictive policy to handle NULL values correctly
    - Allow budget items with is_per_person = false, NULL, or when user is premium
  
  2. Security
    - Free users: can only create budget items with is_per_person = false or NULL
    - Premium users: unrestricted access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "budget_items_insert_check_premium_per_person" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update_check_premium_per_person" ON budget_items;

-- Recreate INSERT policy with NULL handling
CREATE POLICY "budget_items_insert_check_premium_per_person"
ON budget_items
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if is_per_person is false or NULL (normal budget entry)
  (is_per_person IS NULL OR is_per_person = false)
  OR
  -- Or if user has premium subscription
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Recreate UPDATE policy with NULL handling
CREATE POLICY "budget_items_update_check_premium_per_person"
ON budget_items
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Allow update if is_per_person is false or NULL, or user is premium
  (is_per_person IS NULL OR is_per_person = false)
  OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
)
WITH CHECK (
  -- Allow change if is_per_person remains false/NULL or user is premium
  (is_per_person IS NULL OR is_per_person = false)
  OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);