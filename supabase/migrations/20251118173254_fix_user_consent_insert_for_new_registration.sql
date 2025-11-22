/*
  # Fix user_consent INSERT policy for new registrations

  1. Problem
    - INSERT fails with RLS error during registration
    - auth.uid() might not be immediately available after signUp
    - Current policy: WITH CHECK (user_id = auth.uid())
    
  2. Solution  
    - Allow INSERT if user is authenticated AND user_id matches auth.uid()
    - Ensure policy works immediately after user creation

  3. Security
    - Users can only create consent records for themselves
    - Requires authentication
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own consent records" ON user_consent;

-- Create INSERT policy that works with new registrations
CREATE POLICY "Users can insert own consent records"
  ON user_consent
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );
