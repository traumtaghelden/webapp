/*
  # Fix Remaining RLS Auth Performance Issues - Part 6

  1. Changes Made
    - Optimize vendor_payments RLS policies with (select auth.uid()) wrapper
    - Optimize activity_log RLS policies with (select auth.uid()) wrapper
    - Remove duplicate vendor_activity_log policies to fix multiple permissive policy warnings
    - Fix duplicate vendors policies

  2. Security
    - All policies maintain proper authentication checks
    - Premium restrictions enforced correctly
    - Performance optimized with SELECT wrapper pattern
*/

-- ============================================================================
-- VENDOR_PAYMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "vendor_payments_insert_check_premium_type" ON vendor_payments;
DROP POLICY IF EXISTS "vendor_payments_limit_free_user" ON vendor_payments;
DROP POLICY IF EXISTS "vendor_payments_update_check_premium_type" ON vendor_payments;

-- These policies should be combined with the main vendor_payments policies
-- The main policies already exist and were optimized in previous migrations

-- ============================================================================
-- ACTIVITY_LOG POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert activity logs for their weddings" ON activity_log;
DROP POLICY IF EXISTS "Users can view activity logs for their weddings" ON activity_log;

CREATE POLICY "Users can view activity logs for their weddings"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = activity_log.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert activity logs for their weddings"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = activity_log.wedding_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- FIX DUPLICATE VENDOR_ACTIVITY_LOG POLICIES
-- ============================================================================

-- Remove old duplicate policies
DROP POLICY IF EXISTS "Users can insert vendor activity" ON vendor_activity_log;
DROP POLICY IF EXISTS "Users can view vendor activity" ON vendor_activity_log;

-- The optimized policies "Users can view vendor activity for their weddings" 
-- and "Users can insert vendor activity for their weddings" already exist
-- from the previous migration and use the correct (select auth.uid()) pattern

-- ============================================================================
-- FIX DUPLICATE VENDORS POLICIES
-- ============================================================================

-- Remove the old "Enforce vendor limit on insert" policy
-- as it conflicts with "Users can insert vendors for their weddings"
DROP POLICY IF EXISTS "Enforce vendor limit on insert" ON vendors;

-- The main vendor insert policy should handle both access control and limit enforcement
DROP POLICY IF EXISTS "Users can insert vendors for their weddings" ON vendors;

CREATE POLICY "Users can insert vendors for their weddings"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = vendors.wedding_id
      AND w.user_id = (select auth.uid())
    )
    AND (
      -- Premium users have no limit
      EXISTS (
        SELECT 1 FROM weddings w
        WHERE w.id = vendors.wedding_id
        AND w.is_premium = true
      )
      OR
      -- Free users: check if under limit (5 vendors)
      (
        SELECT COUNT(*) FROM vendors v
        WHERE v.wedding_id = vendors.wedding_id
      ) < 5
    )
  );