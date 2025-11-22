/*
  # Optimize RLS Policies - Timeline, Vendors, Wedding Day Tables

  1. Purpose
    - Optimize auth.uid() calls in RLS policies
    - Includes: timeline_block_subtasks, vendors, wedding_day_blocks, wedding_day_vendors

  2. Tables Updated
    - timeline_block_subtasks (4 policies)
    - vendors (4 policies)
    - wedding_day_blocks (4 policies)
    - wedding_day_vendors (4 policies)
*/

-- timeline_block_subtasks policies
DROP POLICY IF EXISTS "Users can view subtasks of their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can create subtasks for their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can update subtasks of their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks of their blocks" ON timeline_block_subtasks;

CREATE POLICY "Users can view subtasks of their blocks"
  ON timeline_block_subtasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create subtasks for their blocks"
  ON timeline_block_subtasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update subtasks of their blocks"
  ON timeline_block_subtasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete subtasks of their blocks"
  ON timeline_block_subtasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = timeline_block_subtasks.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- vendors policies
DROP POLICY IF EXISTS "Users can view vendors for their weddings" ON vendors;
DROP POLICY IF EXISTS "Users can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete vendors" ON vendors;

CREATE POLICY "Users can view vendors for their weddings"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert vendors"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update vendors"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete vendors"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- wedding_day_blocks policies
DROP POLICY IF EXISTS "Users can view blocks for their weddings" ON wedding_day_blocks;
DROP POLICY IF EXISTS "Users can insert blocks for their weddings" ON wedding_day_blocks;
DROP POLICY IF EXISTS "Users can update blocks for their weddings" ON wedding_day_blocks;
DROP POLICY IF EXISTS "Users can delete blocks for their weddings" ON wedding_day_blocks;

CREATE POLICY "Users can view blocks for their weddings"
  ON wedding_day_blocks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert blocks for their weddings"
  ON wedding_day_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update blocks for their weddings"
  ON wedding_day_blocks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete blocks for their weddings"
  ON wedding_day_blocks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- wedding_day_vendors policies
DROP POLICY IF EXISTS "Users can view vendors for their weddings" ON wedding_day_vendors;
DROP POLICY IF EXISTS "Users can insert vendors for their weddings" ON wedding_day_vendors;
DROP POLICY IF EXISTS "Users can update vendors for their weddings" ON wedding_day_vendors;
DROP POLICY IF EXISTS "Users can delete vendors for their weddings" ON wedding_day_vendors;

CREATE POLICY "Users can view vendors for their weddings"
  ON wedding_day_vendors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert vendors for their weddings"
  ON wedding_day_vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update vendors for their weddings"
  ON wedding_day_vendors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete vendors for their weddings"
  ON wedding_day_vendors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );
