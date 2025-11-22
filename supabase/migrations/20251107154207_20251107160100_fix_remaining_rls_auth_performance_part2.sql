/*
  # Fix Remaining RLS Auth Performance Issues - Part 2

  1. Changes Made
    - Optimize budget_payments RLS policies with (select auth.uid()) wrapper
    - Optimize budget_attachments RLS policies with (select auth.uid()) wrapper
    - Optimize budget_partner_splits RLS policies with (select auth.uid()) wrapper
    - Optimize budget_tags RLS policies with (select auth.uid()) wrapper

  2. Security
    - All policies maintain proper authentication checks
    - Premium restrictions enforced correctly
    - Performance optimized with SELECT wrapper pattern
*/

-- ============================================================================
-- BUDGET_PAYMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can insert budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can update budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can view budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_insert_check_premium_type" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_update_check_premium_type" ON budget_payments;

CREATE POLICY "Users can view budget payments for their wedding"
  ON budget_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_payments.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert budget payments for their wedding"
  ON budget_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_payments.budget_item_id
      AND w.user_id = (select auth.uid())
      AND (w.is_premium = true OR budget_payments.payment_type = 'single')
    )
  );

CREATE POLICY "Users can update budget payments for their wedding"
  ON budget_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_payments.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_payments.budget_item_id
      AND w.user_id = (select auth.uid())
      AND (w.is_premium = true OR budget_payments.payment_type = 'single')
    )
  );

CREATE POLICY "Users can delete budget payments for their wedding"
  ON budget_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_payments.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- BUDGET_ATTACHMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete budget attachments for their wedding" ON budget_attachments;
DROP POLICY IF EXISTS "Users can insert budget attachments for their wedding" ON budget_attachments;
DROP POLICY IF EXISTS "Users can view budget attachments for their wedding" ON budget_attachments;

CREATE POLICY "Users can view budget attachments for their wedding"
  ON budget_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_attachments.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert budget attachments for their wedding"
  ON budget_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_attachments.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete budget attachments for their wedding"
  ON budget_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_attachments.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- BUDGET_PARTNER_SPLITS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete partner splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can insert partner splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can update partner splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can view partner splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "budget_partner_splits_delete_premium_only" ON budget_partner_splits;
DROP POLICY IF EXISTS "budget_partner_splits_insert_premium_only" ON budget_partner_splits;
DROP POLICY IF EXISTS "budget_partner_splits_update_premium_only" ON budget_partner_splits;

CREATE POLICY "Users can view partner splits for their wedding"
  ON budget_partner_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_partner_splits.budget_item_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert partner splits for their wedding"
  ON budget_partner_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_partner_splits.budget_item_id
      AND w.user_id = (select auth.uid())
      AND w.is_premium = true
    )
  );

CREATE POLICY "Users can update partner splits for their wedding"
  ON budget_partner_splits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_partner_splits.budget_item_id
      AND w.user_id = (select auth.uid())
      AND w.is_premium = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_partner_splits.budget_item_id
      AND w.user_id = (select auth.uid())
      AND w.is_premium = true
    )
  );

CREATE POLICY "Users can delete partner splits for their wedding"
  ON budget_partner_splits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_partner_splits.budget_item_id
      AND w.user_id = (select auth.uid())
      AND w.is_premium = true
    )
  );

-- ============================================================================
-- BUDGET_TAGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete budget tags for their wedding" ON budget_tags;
DROP POLICY IF EXISTS "Users can insert budget tags for their wedding" ON budget_tags;
DROP POLICY IF EXISTS "Users can update budget tags for their wedding" ON budget_tags;
DROP POLICY IF EXISTS "Users can view budget tags for their wedding" ON budget_tags;

CREATE POLICY "Users can view budget tags for their wedding"
  ON budget_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = budget_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert budget tags for their wedding"
  ON budget_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = budget_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update budget tags for their wedding"
  ON budget_tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = budget_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = budget_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete budget tags for their wedding"
  ON budget_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = budget_tags.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );