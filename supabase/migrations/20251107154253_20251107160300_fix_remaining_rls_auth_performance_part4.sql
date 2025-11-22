/*
  # Fix Remaining RLS Auth Performance Issues - Part 4

  1. Changes Made
    - Optimize guest_communications RLS policies with (select auth.uid()) wrapper
    - Optimize guest_tags RLS policies with (select auth.uid()) wrapper
    - Optimize guest_tag_assignments RLS policies with (select auth.uid()) wrapper
    - Optimize family_groups RLS policies with (select auth.uid()) wrapper

  2. Security
    - All policies maintain proper authentication checks
    - Premium restrictions enforced correctly
    - Performance optimized with SELECT wrapper pattern
*/

-- ============================================================================
-- GUEST_COMMUNICATIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create communications for their wedding guests" ON guest_communications;
DROP POLICY IF EXISTS "Users can delete communications for their wedding guests" ON guest_communications;
DROP POLICY IF EXISTS "Users can update communications for their wedding guests" ON guest_communications;
DROP POLICY IF EXISTS "Users can view communications for their wedding guests" ON guest_communications;

CREATE POLICY "Users can view communications for their wedding guests"
  ON guest_communications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN weddings w ON w.id = g.wedding_id
      WHERE g.id = guest_communications.guest_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create communications for their wedding guests"
  ON guest_communications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN weddings w ON w.id = g.wedding_id
      WHERE g.id = guest_communications.guest_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update communications for their wedding guests"
  ON guest_communications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN weddings w ON w.id = g.wedding_id
      WHERE g.id = guest_communications.guest_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN weddings w ON w.id = g.wedding_id
      WHERE g.id = guest_communications.guest_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete communications for their wedding guests"
  ON guest_communications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN weddings w ON w.id = g.wedding_id
      WHERE g.id = guest_communications.guest_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- GUEST_TAGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create tags for their wedding" ON guest_tags;
DROP POLICY IF EXISTS "Users can delete tags for their wedding" ON guest_tags;
DROP POLICY IF EXISTS "Users can update tags for their wedding" ON guest_tags;
DROP POLICY IF EXISTS "Users can view tags for their wedding" ON guest_tags;

CREATE POLICY "Users can view tags for their wedding"
  ON guest_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = guest_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create tags for their wedding"
  ON guest_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = guest_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update tags for their wedding"
  ON guest_tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = guest_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = guest_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete tags for their wedding"
  ON guest_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = guest_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- GUEST_TAG_ASSIGNMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create tag assignments for their wedding guests" ON guest_tag_assignments;
DROP POLICY IF EXISTS "Users can delete tag assignments for their wedding guests" ON guest_tag_assignments;
DROP POLICY IF EXISTS "Users can view tag assignments for their wedding guests" ON guest_tag_assignments;

CREATE POLICY "Users can view tag assignments for their wedding guests"
  ON guest_tag_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN weddings w ON w.id = g.wedding_id
      WHERE g.id = guest_tag_assignments.guest_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create tag assignments for their wedding guests"
  ON guest_tag_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN weddings w ON w.id = g.wedding_id
      WHERE g.id = guest_tag_assignments.guest_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete tag assignments for their wedding guests"
  ON guest_tag_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN weddings w ON w.id = g.wedding_id
      WHERE g.id = guest_tag_assignments.guest_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- FAMILY_GROUPS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create family groups for their weddings" ON family_groups;
DROP POLICY IF EXISTS "Users can delete family groups for their weddings" ON family_groups;
DROP POLICY IF EXISTS "Users can update family groups for their weddings" ON family_groups;
DROP POLICY IF EXISTS "Users can view family groups for their weddings" ON family_groups;
DROP POLICY IF EXISTS "family_groups_insert_check_premium" ON family_groups;
DROP POLICY IF EXISTS "family_groups_update_check_premium" ON family_groups;

CREATE POLICY "Users can view family groups for their weddings"
  ON family_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = family_groups.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create family groups for their weddings"
  ON family_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = family_groups.wedding_id
      AND w.user_id = (select auth.uid())
      AND w.is_premium = true
    )
  );

CREATE POLICY "Users can update family groups for their weddings"
  ON family_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = family_groups.wedding_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = family_groups.wedding_id
      AND w.user_id = (select auth.uid())
      AND w.is_premium = true
    )
  );

CREATE POLICY "Users can delete family groups for their weddings"
  ON family_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = family_groups.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );