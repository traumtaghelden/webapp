/*
  # Fix Duplicate RLS Policies on user_profiles
  
  1. Issue
    - Multiple SELECT and UPDATE policies exist on user_profiles table
    - Causing "policy already exists" errors
  
  2. Solution
    - Drop old duplicate policies
    - Keep only the optimized versions with (SELECT auth.uid())
*/

-- Drop old duplicate policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- The correct policies with (SELECT auth.uid()) optimization are already in place:
-- "Users can view their own profile"
-- "Users can update their own profile"
-- "Admins can view all profiles"
-- "Admins can update all profiles"
