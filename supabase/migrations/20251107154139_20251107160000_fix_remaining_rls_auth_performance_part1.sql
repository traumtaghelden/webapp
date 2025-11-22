/*
  # Fix Remaining RLS Auth Performance Issues - Part 1

  1. Changes Made
    - Optimize task_subtasks RLS policies with (select auth.uid()) wrapper
    - Optimize task_dependencies RLS policies with (select auth.uid()) wrapper
    - Optimize task_recurrence RLS policies with (select auth.uid()) wrapper
    - Optimize recurring_tasks RLS policies with (select auth.uid()) wrapper
    - Remove duplicate policies to fix multiple permissive policy warnings

  2. Security
    - All policies maintain proper authentication checks
    - Performance optimized with SELECT wrapper pattern
*/

-- ============================================================================
-- TASK_SUBTASKS POLICIES
-- ============================================================================

-- Remove old policies
DROP POLICY IF EXISTS "Users can create subtasks for their wedding tasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks for their wedding tasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can update subtasks for their wedding tasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can view subtasks for their wedding tasks" ON task_subtasks;

-- Policies are already optimized in previous migration, but ensure no duplicates exist

-- ============================================================================
-- TASK_DEPENDENCIES POLICIES
-- ============================================================================

-- Remove old policies
DROP POLICY IF EXISTS "Users can create dependencies for their wedding tasks" ON task_dependencies;
DROP POLICY IF EXISTS "Users can delete dependencies for their wedding tasks" ON task_dependencies;
DROP POLICY IF EXISTS "Users can view dependencies for their wedding tasks" ON task_dependencies;

-- Policies are already optimized in previous migration, but ensure no duplicates exist

-- ============================================================================
-- TASK_RECURRENCE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create recurrence for their wedding tasks" ON task_recurrence;
DROP POLICY IF EXISTS "Users can delete recurrence for their wedding tasks" ON task_recurrence;
DROP POLICY IF EXISTS "Users can update recurrence for their wedding tasks" ON task_recurrence;
DROP POLICY IF EXISTS "Users can view recurrence for their wedding tasks" ON task_recurrence;

CREATE POLICY "Users can view recurrence for their wedding tasks"
  ON task_recurrence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_recurrence.task_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create recurrence for their wedding tasks"
  ON task_recurrence FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_recurrence.task_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update recurrence for their wedding tasks"
  ON task_recurrence FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_recurrence.task_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_recurrence.task_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete recurrence for their wedding tasks"
  ON task_recurrence FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN weddings w ON w.id = t.wedding_id
      WHERE t.id = task_recurrence.task_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- RECURRING_TASKS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create recurring tasks for their wedding" ON recurring_tasks;
DROP POLICY IF EXISTS "Users can delete their wedding recurring tasks" ON recurring_tasks;
DROP POLICY IF EXISTS "Users can update their wedding recurring tasks" ON recurring_tasks;
DROP POLICY IF EXISTS "Users can view their wedding recurring tasks" ON recurring_tasks;

CREATE POLICY "Users can view their wedding recurring tasks"
  ON recurring_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_tasks.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create recurring tasks for their wedding"
  ON recurring_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_tasks.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their wedding recurring tasks"
  ON recurring_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_tasks.wedding_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_tasks.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their wedding recurring tasks"
  ON recurring_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_tasks.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );