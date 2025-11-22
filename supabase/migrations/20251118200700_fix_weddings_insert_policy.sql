/*
  # Fix weddings table INSERT policy
  
  1. Changes
    - Add INSERT policy for authenticated users to create their own wedding
    - Policy checks that user_id matches auth.uid()
  
  2. Security
    - Users can only insert weddings for themselves
    - WITH CHECK ensures user_id matches authenticated user
*/

-- Drop policy if it exists
DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;

-- Add INSERT policy for weddings table
CREATE POLICY "Users can insert own weddings"
  ON weddings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
