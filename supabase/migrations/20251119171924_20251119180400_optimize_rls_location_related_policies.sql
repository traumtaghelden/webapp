/*
  # Optimize RLS Policies - Location Related Tables

  1. Purpose
    - Optimize auth.uid() calls in location-related RLS policies
    - Includes: location_attachments, location_timeline_assignments

  2. Tables Updated
    - location_attachments (3 policies)
    - location_timeline_assignments (4 policies)
*/

-- location_attachments policies
DROP POLICY IF EXISTS "Users can view attachments for their wedding locations" ON location_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their wedding locations" ON location_attachments;
DROP POLICY IF EXISTS "Users can delete attachments for their wedding locations" ON location_attachments;

CREATE POLICY "Users can view attachments for their wedding locations"
  ON location_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_attachments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert attachments for their wedding locations"
  ON location_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_attachments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete attachments for their wedding locations"
  ON location_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_attachments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- location_timeline_assignments policies (Note: uses timeline_event_id, not block_id)
DROP POLICY IF EXISTS "Users can view location timeline assignments" ON location_timeline_assignments;
DROP POLICY IF EXISTS "Users can insert location timeline assignments" ON location_timeline_assignments;
DROP POLICY IF EXISTS "Users can update location timeline assignments" ON location_timeline_assignments;
DROP POLICY IF EXISTS "Users can delete location timeline assignments" ON location_timeline_assignments;

CREATE POLICY "Users can view location timeline assignments"
  ON location_timeline_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert location timeline assignments"
  ON location_timeline_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update location timeline assignments"
  ON location_timeline_assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete location timeline assignments"
  ON location_timeline_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );
