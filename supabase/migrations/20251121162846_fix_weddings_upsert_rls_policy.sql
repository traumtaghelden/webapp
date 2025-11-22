/*
  # Fix weddings table RLS policies for upsert operations

  1. Problem
    - Upsert operations fail with RLS policy violation
    - The issue occurs because upsert needs both INSERT and UPDATE permissions
    - Current policies are correctly configured but may have edge cases

  2. Changes
    - Recreate INSERT policy to ensure it works with upsert
    - Recreate UPDATE policy to ensure it works with upsert
    - Ensure policies allow users to create and update their own wedding data

  3. Security
    - Users can only insert/update weddings where user_id matches auth.uid()
    - No change to security posture, just fixing the policy definitions
*/

-- Drop existing INSERT and UPDATE policies
DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can update own weddings" ON weddings;

-- Recreate INSERT policy with explicit check
CREATE POLICY "Users can insert own weddings"
  ON weddings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Recreate UPDATE policy with explicit checks
CREATE POLICY "Users can update own weddings"
  ON weddings
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );
