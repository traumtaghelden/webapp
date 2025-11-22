/*
  # Simplify user_profiles RLS Policies
  
  1. Issue
    - Admin policies have recursive subquery causing "multiple policies detected" error
    - Queries like: EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid())
      cause infinite recursion when querying user_profiles
  
  2. Solution
    - Drop all existing policies
    - Create simple, non-recursive policies
    - Use user_role column directly without subquery
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Create simple, non-recursive policies
-- SELECT policies
CREATE POLICY "user_profiles_select_own"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "user_profiles_select_admin"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_role = 'admin');

-- INSERT policies
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE policies
CREATE POLICY "user_profiles_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_admin"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_role = 'admin')
  WITH CHECK (user_role = 'admin');

-- CREATE INDEX for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON user_profiles(user_role);
