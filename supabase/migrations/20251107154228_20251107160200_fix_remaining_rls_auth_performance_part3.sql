/*
  # Fix Remaining RLS Auth Performance Issues - Part 3

  1. Changes Made
    - Optimize recurring_budget_items RLS policies with (select auth.uid()) wrapper
    - Optimize budget_item_tags RLS policies with (select auth.uid()) wrapper
    - Optimize user_consent RLS policies with (select auth.uid()) wrapper
    - Optimize cookie_preferences RLS policies with (select auth.uid()) wrapper
    - Optimize data_deletion_requests RLS policies with (select auth.uid()) wrapper

  2. Security
    - All policies maintain proper authentication checks
    - Performance optimized with SELECT wrapper pattern
*/

-- ============================================================================
-- RECURRING_BUDGET_ITEMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete recurring budget items for their weddings" ON recurring_budget_items;
DROP POLICY IF EXISTS "Users can insert recurring budget items for their weddings" ON recurring_budget_items;
DROP POLICY IF EXISTS "Users can update recurring budget items for their weddings" ON recurring_budget_items;
DROP POLICY IF EXISTS "Users can view recurring budget items for their weddings" ON recurring_budget_items;

CREATE POLICY "Users can view recurring budget items for their weddings"
  ON recurring_budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_budget_items.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert recurring budget items for their weddings"
  ON recurring_budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_budget_items.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update recurring budget items for their weddings"
  ON recurring_budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_budget_items.wedding_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_budget_items.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete recurring budget items for their weddings"
  ON recurring_budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = recurring_budget_items.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- BUDGET_ITEM_TAGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete budget item tags for their wedding" ON budget_item_tags;
DROP POLICY IF EXISTS "Users can insert budget item tags for their wedding" ON budget_item_tags;
DROP POLICY IF EXISTS "Users can view budget item tags for their wedding" ON budget_item_tags;

CREATE POLICY "Users can view budget item tags for their wedding"
  ON budget_item_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_tags.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert budget item tags for their wedding"
  ON budget_item_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_tags.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete budget item tags for their wedding"
  ON budget_item_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_tags.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- USER_CONSENT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own consent records" ON user_consent;
DROP POLICY IF EXISTS "Users can update own consent records" ON user_consent;
DROP POLICY IF EXISTS "Users can view own consent records" ON user_consent;

CREATE POLICY "Users can view own consent records"
  ON user_consent FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own consent records"
  ON user_consent FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own consent records"
  ON user_consent FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- COOKIE_PREFERENCES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own cookie preferences" ON cookie_preferences;
DROP POLICY IF EXISTS "Users can view own cookie preferences" ON cookie_preferences;

CREATE POLICY "Users can view own cookie preferences"
  ON cookie_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own cookie preferences"
  ON cookie_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- DATA_DELETION_REQUESTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own deletion requests" ON data_deletion_requests;
DROP POLICY IF EXISTS "Users can update own deletion requests" ON data_deletion_requests;
DROP POLICY IF EXISTS "Users can view own deletion requests" ON data_deletion_requests;

CREATE POLICY "Users can view own deletion requests"
  ON data_deletion_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own deletion requests"
  ON data_deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own deletion requests"
  ON data_deletion_requests FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));