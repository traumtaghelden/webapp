/*
  # Fix Infinite Recursion in Admin Policy

  1. Problem
    - Admin select policy causes infinite recursion
    - Policy queries user_profiles which triggers the same policy

  2. Solution
    - Create a security definer function to check admin status
    - Function bypasses RLS to avoid recursion
    - Use function in policy instead of direct query

  3. Security
    - Function is secure and only checks if current user is admin
    - Admins can view all profiles
    - Regular users can only view their own
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "user_profiles_select_admin" ON user_profiles;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_role = 'admin'
  );
END;
$$;

-- Create new admin select policy using the function
CREATE POLICY "user_profiles_select_admin" 
ON user_profiles
FOR SELECT
TO authenticated
USING (is_admin());
