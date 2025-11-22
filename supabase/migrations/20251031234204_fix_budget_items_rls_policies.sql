/*
  # Fix budget_items RLS policies
  
  1. Changes
    - Remove conflicting "Anyone can manage budget items" policy
    - Ensure correct RLS policies are in place for all operations
  
  2. Security
    - Users can only manage budget items for their own weddings
    - All operations require authentication and ownership check
*/

-- Drop the problematic "Anyone can manage budget items" policy
DROP POLICY IF EXISTS "Anyone can manage budget items" ON budget_items;

-- Ensure the correct policies exist
DROP POLICY IF EXISTS "Users can view budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete budget items" ON budget_items;

CREATE POLICY "Users can view budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );
