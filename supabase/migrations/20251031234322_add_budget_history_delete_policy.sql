/*
  # Add DELETE policy for budget_history
  
  1. Changes
    - Add DELETE policy for budget_history table
    - Allows cascade deletes when budget_items are deleted
  
  2. Security
    - Users can only delete budget history for their own weddings
    - Maintains data integrity with cascade deletes
*/

-- Add DELETE policy for budget_history
CREATE POLICY "Users can delete budget history for their weddings"
  ON budget_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_history.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );
