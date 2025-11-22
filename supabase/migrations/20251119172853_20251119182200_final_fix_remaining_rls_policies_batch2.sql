/*
  # Final Fix: Remaining RLS Policies Batch 2

  1. Tables Covered
    - wedding_day_blocks
    - wedding_day_vendors
    - budget_categories
    - wedding_day_checklist
    - tasks
*/

-- ============================================================================
-- WEDDING_DAY_BLOCKS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view blocks for their weddings" ON wedding_day_blocks;
DROP POLICY IF EXISTS "Users can insert blocks for their weddings" ON wedding_day_blocks;
DROP POLICY IF EXISTS "Users can update blocks for their weddings" ON wedding_day_blocks;
DROP POLICY IF EXISTS "Users can delete blocks for their weddings" ON wedding_day_blocks;

CREATE POLICY "Users can view blocks for their weddings"
  ON wedding_day_blocks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert blocks for their weddings"
  ON wedding_day_blocks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update blocks for their weddings"
  ON wedding_day_blocks FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete blocks for their weddings"
  ON wedding_day_blocks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- WEDDING_DAY_VENDORS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view vendors for their weddings" ON wedding_day_vendors;
DROP POLICY IF EXISTS "Users can insert vendors for their weddings" ON wedding_day_vendors;
DROP POLICY IF EXISTS "Users can update vendors for their weddings" ON wedding_day_vendors;
DROP POLICY IF EXISTS "Users can delete vendors for their weddings" ON wedding_day_vendors;

CREATE POLICY "Users can view vendors for their weddings"
  ON wedding_day_vendors FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert vendors for their weddings"
  ON wedding_day_vendors FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update vendors for their weddings"
  ON wedding_day_vendors FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete vendors for their weddings"
  ON wedding_day_vendors FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- BUDGET_CATEGORIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert budget categories if not read-only" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories if not read-only" ON budget_categories;
DROP POLICY IF EXISTS "Users can delete budget categories if not read-only" ON budget_categories;

CREATE POLICY "Users can insert budget categories if not read-only"
  ON budget_categories FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update budget categories if not read-only"
  ON budget_categories FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete budget categories if not read-only"
  ON budget_categories FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- WEDDING_DAY_CHECKLIST TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view checklist items for their weddings" ON wedding_day_checklist;
DROP POLICY IF EXISTS "Users can insert checklist items for their weddings" ON wedding_day_checklist;
DROP POLICY IF EXISTS "Users can update checklist items for their weddings" ON wedding_day_checklist;
DROP POLICY IF EXISTS "Users can delete checklist items for their weddings" ON wedding_day_checklist;

CREATE POLICY "Users can view checklist items for their weddings"
  ON wedding_day_checklist FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert checklist items for their weddings"
  ON wedding_day_checklist FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update checklist items for their weddings"
  ON wedding_day_checklist FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete checklist items for their weddings"
  ON wedding_day_checklist FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view tasks for their weddings" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

CREATE POLICY "Users can view tasks for their weddings"
  ON tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );
