/*
  # Fix budget_history deletion policy

  1. Changes
    - Simplify DELETE policy for budget_history to work with CASCADE deletes
    - Use wedding_id directly instead of joining through budget_items
    - This allows CASCADE deletes to work properly

  2. Security
    - Maintains security by checking wedding ownership via wedding_id
    - Users can only delete history for their own weddings
*/

-- Drop the existing problematic DELETE policy
DROP POLICY IF EXISTS "Users can delete budget history for their weddings" ON budget_history;

-- Create a simpler DELETE policy that works with CASCADE
CREATE POLICY "Users can delete budget history for their weddings"
  ON budget_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_history.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );
