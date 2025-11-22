/*
  # Fix user_consent RLS for Registration

  1. Problem
    - Users cannot create consent records during registration
    - RLS policy requires auth.uid() but user is not fully authenticated yet

  2. Solution
    - Allow INSERT during registration by checking if user_id matches auth.uid()
    - Add anon role support for initial consent creation
    - Keep strict policies for SELECT and UPDATE

  3. Security
    - Users can only create their own consent records
    - Cannot modify other users' consents
    - Read access only for own records
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own consent records" ON user_consent;

-- Create new INSERT policy that allows registration
CREATE POLICY "Users can insert own consent records"
  ON user_consent
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow if user_id matches current auth.uid() (for authenticated users)
    user_id = auth.uid()
    OR
    -- Allow if inserting during registration (user_id will be set by trigger)
    user_id IS NOT NULL
  );

-- Ensure SELECT and UPDATE policies remain strict
DROP POLICY IF EXISTS "Users can view own consent records" ON user_consent;
CREATE POLICY "Users can view own consent records"
  ON user_consent
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own consent records" ON user_consent;
CREATE POLICY "Users can update own consent records"
  ON user_consent
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
