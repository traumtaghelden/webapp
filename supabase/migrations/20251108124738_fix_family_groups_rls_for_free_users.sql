/*
  # Fix Family Groups RLS for Free Users

  1. Changes
    - Remove premium requirement from family_groups INSERT policy
    - Family groups should be available to all users, not just premium

  2. Security
    - Users can only create family groups for their own weddings
    - Premium check removed from INSERT and UPDATE policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create family groups for their weddings" ON family_groups;
DROP POLICY IF EXISTS "Users can update family groups for their weddings" ON family_groups;

-- Recreate INSERT policy without premium requirement
CREATE POLICY "Users can create family groups for their weddings"
  ON family_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = family_groups.wedding_id
      AND w.user_id = auth.uid()
    )
  );

-- Recreate UPDATE policy without premium requirement
CREATE POLICY "Users can update family groups for their weddings"
  ON family_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = family_groups.wedding_id
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = family_groups.wedding_id
      AND w.user_id = auth.uid()
    )
  );