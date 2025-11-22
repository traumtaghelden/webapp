/*
  # Optimize RLS Policies - Locations

  1. Purpose
    - Optimize auth.uid() calls in locations RLS policies
    - Improve query performance at scale

  2. Tables Updated
    - locations (4 policies)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view locations for their weddings" ON locations;
DROP POLICY IF EXISTS "Users can insert locations" ON locations;
DROP POLICY IF EXISTS "Users can update locations" ON locations;
DROP POLICY IF EXISTS "Users can delete locations" ON locations;

-- Recreate with optimized auth checks
CREATE POLICY "Users can view locations for their weddings"
  ON locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert locations"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update locations"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete locations"
  ON locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );
