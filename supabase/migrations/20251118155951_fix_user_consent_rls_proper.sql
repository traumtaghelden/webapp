/*
  # Fix user_consent RLS Policy

  1. Problem
    - INSERT policy uses WITH CHECK (true) which is too permissive
    - Should enforce that user_id matches auth.uid()
    
  2. Solution  
    - Update INSERT policy to enforce user_id = auth.uid()
    - Keep authentication requirement
    - Maintain proper security

  3. Security
    - Users can only create records for their own user_id
    - All operations require authentication
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own consent records" ON user_consent;

-- Create proper INSERT policy that enforces user_id matching
CREATE POLICY "Users can insert own consent records"
  ON user_consent
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
