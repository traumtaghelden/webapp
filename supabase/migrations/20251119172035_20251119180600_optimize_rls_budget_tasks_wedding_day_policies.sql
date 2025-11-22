/*
  # Optimize RLS Policies - Budget, Tasks, Wedding Day Tables

  1. Purpose
    - Optimize auth.uid() calls in RLS policies
    - Includes: budget_categories, tasks, wedding_day_checklist, wedding_day_packing_list, budget_payments

  2. Tables Updated
    - budget_categories (3 policies)
    - tasks (4 policies)
    - wedding_day_checklist (4 policies)
    - wedding_day_packing_list (4 policies)
    - budget_payments (3 policies)
*/

-- budget_categories policies
DROP POLICY IF EXISTS "Users can insert budget categories if not read-only" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories if not read-only" ON budget_categories;
DROP POLICY IF EXISTS "Users can delete budget categories if not read-only" ON budget_categories;

CREATE POLICY "Users can insert budget categories if not read-only"
  ON budget_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update budget categories if not read-only"
  ON budget_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete budget categories if not read-only"
  ON budget_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- tasks policies
DROP POLICY IF EXISTS "Users can view tasks for their weddings" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

CREATE POLICY "Users can view tasks for their weddings"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- wedding_day_checklist policies
DROP POLICY IF EXISTS "Users can view checklist items for their weddings" ON wedding_day_checklist;
DROP POLICY IF EXISTS "Users can insert checklist items for their weddings" ON wedding_day_checklist;
DROP POLICY IF EXISTS "Users can update checklist items for their weddings" ON wedding_day_checklist;
DROP POLICY IF EXISTS "Users can delete checklist items for their weddings" ON wedding_day_checklist;

CREATE POLICY "Users can view checklist items for their weddings"
  ON wedding_day_checklist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert checklist items for their weddings"
  ON wedding_day_checklist
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update checklist items for their weddings"
  ON wedding_day_checklist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete checklist items for their weddings"
  ON wedding_day_checklist
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- wedding_day_packing_list policies
DROP POLICY IF EXISTS "Users can view packing items for their weddings" ON wedding_day_packing_list;
DROP POLICY IF EXISTS "Users can insert packing items for their weddings" ON wedding_day_packing_list;
DROP POLICY IF EXISTS "Users can update packing items for their weddings" ON wedding_day_packing_list;
DROP POLICY IF EXISTS "Users can delete packing items for their weddings" ON wedding_day_packing_list;

CREATE POLICY "Users can view packing items for their weddings"
  ON wedding_day_packing_list
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert packing items for their weddings"
  ON wedding_day_packing_list
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update packing items for their weddings"
  ON wedding_day_packing_list
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete packing items for their weddings"
  ON wedding_day_packing_list
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- budget_payments policies
DROP POLICY IF EXISTS "Users can insert budget payments if not read-only" ON budget_payments;
DROP POLICY IF EXISTS "Users can update budget payments if not read-only" ON budget_payments;
DROP POLICY IF EXISTS "Users can delete budget payments if not read-only" ON budget_payments;

CREATE POLICY "Users can insert budget payments if not read-only"
  ON budget_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update budget payments if not read-only"
  ON budget_payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete budget payments if not read-only"
  ON budget_payments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );
