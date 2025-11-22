/*
  # Complete Final RLS Policy Optimization

  1. Changes Made
    - Optimize all remaining RLS policies with (select auth.uid()) wrapper
    - Fix budget_items premium policies with correct column name
    - Optimize vendor and task related policies
    - Ensure consistent performance across all tables

  2. Security
    - All policies maintain proper authentication checks
    - Premium feature restrictions enforced correctly
    - Performance optimized with SELECT wrapper pattern
*/

-- Fix budget_items premium policies with correct column name
DROP POLICY IF EXISTS "Premium: Users can manage per-person costs" ON budget_items;

CREATE POLICY "Premium: Users can manage per-person costs"
  ON budget_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = budget_items.wedding_id
      AND w.user_id = (select auth.uid())
      AND (w.is_premium = true OR budget_items.cost_per_person IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = budget_items.wedding_id
      AND w.user_id = (select auth.uid())
      AND (w.is_premium = true OR budget_items.cost_per_person IS NULL)
    )
  );

-- Optimize remaining vendor activity log policies
DROP POLICY IF EXISTS "Users can view vendor activity for their weddings" ON vendor_activity_log;
DROP POLICY IF EXISTS "Users can insert vendor activity for their weddings" ON vendor_activity_log;

CREATE POLICY "Users can view vendor activity for their weddings"
  ON vendor_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON w.id = v.wedding_id
      WHERE v.id = vendor_activity_log.vendor_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert vendor activity for their weddings"
  ON vendor_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON w.id = v.wedding_id
      WHERE v.id = vendor_activity_log.vendor_id
      AND w.user_id = (select auth.uid())
    )
  );

-- Optimize task dependencies policies
DROP POLICY IF EXISTS "Users can view task dependencies for their weddings" ON task_dependencies;
DROP POLICY IF EXISTS "Users can manage task dependencies for their weddings" ON task_dependencies;

CREATE POLICY "Users can view task dependencies for their weddings"
  ON task_dependencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_dependencies.task_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage task dependencies for their weddings"
  ON task_dependencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_dependencies.task_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_dependencies.task_id
      AND w.user_id = (select auth.uid())
    )
  );

-- Optimize task subtasks policies
DROP POLICY IF EXISTS "Users can view subtasks for their weddings" ON task_subtasks;
DROP POLICY IF EXISTS "Users can manage subtasks for their weddings" ON task_subtasks;

CREATE POLICY "Users can view subtasks for their weddings"
  ON task_subtasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_subtasks.task_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage subtasks for their weddings"
  ON task_subtasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_subtasks.task_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_subtasks.task_id
      AND w.user_id = (select auth.uid())
    )
  );