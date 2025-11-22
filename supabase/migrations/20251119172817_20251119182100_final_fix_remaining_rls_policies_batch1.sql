/*
  # Final Fix: Remaining RLS Policies Batch 1

  1. Tables Covered
    - location_categories
    - location_attachments
    - location_timeline_assignments
    - timeline_block_subtasks
    - vendors
*/

-- ============================================================================
-- LOCATION_CATEGORIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their wedding location categories" ON location_categories;
DROP POLICY IF EXISTS "Users can insert location categories for their wedding" ON location_categories;
DROP POLICY IF EXISTS "Users can update their wedding location categories" ON location_categories;
DROP POLICY IF EXISTS "Users can delete their wedding location categories" ON location_categories;

CREATE POLICY "Users can view their wedding location categories"
  ON location_categories FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert location categories for their wedding"
  ON location_categories FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update their wedding location categories"
  ON location_categories FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete their wedding location categories"
  ON location_categories FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- LOCATION_ATTACHMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view attachments for their wedding locations" ON location_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their wedding locations" ON location_attachments;
DROP POLICY IF EXISTS "Users can delete attachments for their wedding locations" ON location_attachments;

CREATE POLICY "Users can view attachments for their wedding locations"
  ON location_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_attachments.location_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert attachments for their wedding locations"
  ON location_attachments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_attachments.location_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete attachments for their wedding locations"
  ON location_attachments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_attachments.location_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- LOCATION_TIMELINE_ASSIGNMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view location timeline assignments" ON location_timeline_assignments;
DROP POLICY IF EXISTS "Users can insert location timeline assignments" ON location_timeline_assignments;
DROP POLICY IF EXISTS "Users can update location timeline assignments" ON location_timeline_assignments;
DROP POLICY IF EXISTS "Users can delete location timeline assignments" ON location_timeline_assignments;

CREATE POLICY "Users can view location timeline assignments"
  ON location_timeline_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert location timeline assignments"
  ON location_timeline_assignments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update location timeline assignments"
  ON location_timeline_assignments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete location timeline assignments"
  ON location_timeline_assignments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_timeline_assignments.location_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- TIMELINE_BLOCK_SUBTASKS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view subtasks of their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can create subtasks for their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can update subtasks of their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks of their blocks" ON timeline_block_subtasks;

CREATE POLICY "Users can view subtasks of their blocks"
  ON timeline_block_subtasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create subtasks for their blocks"
  ON timeline_block_subtasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update subtasks of their blocks"
  ON timeline_block_subtasks FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete subtasks of their blocks"
  ON timeline_block_subtasks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- VENDORS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view vendors for their weddings" ON vendors;
DROP POLICY IF EXISTS "Users can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete vendors" ON vendors;

CREATE POLICY "Users can view vendors for their weddings"
  ON vendors FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert vendors"
  ON vendors FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update vendors"
  ON vendors FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete vendors"
  ON vendors FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );
