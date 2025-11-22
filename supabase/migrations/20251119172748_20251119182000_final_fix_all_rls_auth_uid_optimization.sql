/*
  # Final Fix: Optimize ALL RLS Policies with auth.uid()

  1. Purpose
    - Complete fix for all auth.uid() optimization issues
    - Replace ALL instances of bare auth.uid() with (select auth.uid())
    - This is a comprehensive fix after previous partial updates

  2. Approach
    - Drop ALL policies that need optimization
    - Recreate with proper (select auth.uid()) syntax
    - Covers all tables flagged by linter
*/

-- ============================================================================
-- USER_FEEDBACK TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own feedback" ON user_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback via RPC" ON user_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON user_feedback;
DROP POLICY IF EXISTS "Admins can update feedback visibility" ON user_feedback;

CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own feedback via RPC"
  ON user_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all feedback"
  ON user_feedback FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND user_role = 'admin'
    )
  );

CREATE POLICY "Admins can update feedback visibility"
  ON user_feedback FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND user_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND user_role = 'admin'
    )
  );

-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view locations for their weddings" ON locations;
DROP POLICY IF EXISTS "Users can insert locations" ON locations;
DROP POLICY IF EXISTS "Users can update locations" ON locations;
DROP POLICY IF EXISTS "Users can delete locations" ON locations;

CREATE POLICY "Users can view locations for their weddings"
  ON locations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert locations"
  ON locations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update locations"
  ON locations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete locations"
  ON locations FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = locations.wedding_id
        AND weddings.user_id = (SELECT auth.uid())
    )
  );
