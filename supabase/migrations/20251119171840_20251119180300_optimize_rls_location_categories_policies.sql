/*
  # Optimize RLS Policies - Location Categories

  1. Purpose
    - Optimize auth.uid() calls in location_categories RLS policies
    - Improve query performance at scale

  2. Tables Updated
    - location_categories (4 policies)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their wedding location categories" ON location_categories;
DROP POLICY IF EXISTS "Users can insert location categories for their wedding" ON location_categories;
DROP POLICY IF EXISTS "Users can update their wedding location categories" ON location_categories;
DROP POLICY IF EXISTS "Users can delete their wedding location categories" ON location_categories;

-- Recreate with optimized auth checks
CREATE POLICY "Users can view their wedding location categories"
  ON location_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert location categories for their wedding"
  ON location_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their wedding location categories"
  ON location_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their wedding location categories"
  ON location_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );
