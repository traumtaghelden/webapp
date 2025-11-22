/*
  # Fix user_profiles Admin SELECT Policy

  1. Problem
    - Current policy only allows admins to see OTHER admins
    - Should allow admins to see ALL users

  2. Changes
    - Drop incorrect admin select policy
    - Create new policy that checks if CURRENT user is admin
    - Use subquery to check auth.uid()'s role

  3. Security
    - Admins can view all user profiles
    - Regular users can only view their own profile
*/

-- Drop the incorrect admin select policy
DROP POLICY IF EXISTS "user_profiles_select_admin" ON user_profiles;

-- Create correct admin select policy
-- Checks if the CURRENT user (auth.uid()) has admin role
CREATE POLICY "user_profiles_select_admin" 
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
);
