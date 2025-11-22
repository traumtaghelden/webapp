/*
  # Fix Remaining RLS Auth Performance Issues - Part 5

  1. Changes Made
    - Optimize timeline_event_guest_attendance RLS policies with (select auth.uid()) wrapper
    - Optimize vendor_event_assignments RLS policies with (select auth.uid()) wrapper
    - Optimize stripe tables RLS policies with (select auth.uid()) wrapper
    - Optimize budget_items premium policies with (select auth.uid()) wrapper

  2. Security
    - All policies maintain proper authentication checks
    - Performance optimized with SELECT wrapper pattern
*/

-- ============================================================================
-- TIMELINE_EVENT_GUEST_ATTENDANCE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create guest attendance for their weddings" ON timeline_event_guest_attendance;
DROP POLICY IF EXISTS "Users can delete guest attendance for their weddings" ON timeline_event_guest_attendance;
DROP POLICY IF EXISTS "Users can update guest attendance for their weddings" ON timeline_event_guest_attendance;
DROP POLICY IF EXISTS "Users can view guest attendance for their weddings" ON timeline_event_guest_attendance;

CREATE POLICY "Users can view guest attendance for their weddings"
  ON timeline_event_guest_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON w.id = wt.wedding_id
      WHERE wt.id = timeline_event_guest_attendance.timeline_event_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create guest attendance for their weddings"
  ON timeline_event_guest_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON w.id = wt.wedding_id
      WHERE wt.id = timeline_event_guest_attendance.timeline_event_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update guest attendance for their weddings"
  ON timeline_event_guest_attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON w.id = wt.wedding_id
      WHERE wt.id = timeline_event_guest_attendance.timeline_event_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON w.id = wt.wedding_id
      WHERE wt.id = timeline_event_guest_attendance.timeline_event_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete guest attendance for their weddings"
  ON timeline_event_guest_attendance FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON w.id = wt.wedding_id
      WHERE wt.id = timeline_event_guest_attendance.timeline_event_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- VENDOR_EVENT_ASSIGNMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create vendor event assignments for their weddings" ON vendor_event_assignments;
DROP POLICY IF EXISTS "Users can delete vendor event assignments for their weddings" ON vendor_event_assignments;
DROP POLICY IF EXISTS "Users can update vendor event assignments for their weddings" ON vendor_event_assignments;
DROP POLICY IF EXISTS "Users can view vendor event assignments for their weddings" ON vendor_event_assignments;

CREATE POLICY "Users can view vendor event assignments for their weddings"
  ON vendor_event_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON w.id = v.wedding_id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create vendor event assignments for their weddings"
  ON vendor_event_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON w.id = v.wedding_id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update vendor event assignments for their weddings"
  ON vendor_event_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON w.id = v.wedding_id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON w.id = v.wedding_id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete vendor event assignments for their weddings"
  ON vendor_event_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON w.id = v.wedding_id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- STRIPE TABLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;

CREATE POLICY "Users can view their own customer data"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;

CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stripe_customers sc
      WHERE sc.customer_id = stripe_subscriptions.customer_id
      AND sc.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;

CREATE POLICY "Users can view their own order data"
  ON stripe_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stripe_customers sc
      WHERE sc.customer_id = stripe_orders.customer_id
      AND sc.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- BUDGET_ITEMS PREMIUM POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Restrict pro-kopf features to premium users" ON budget_items;
DROP POLICY IF EXISTS "Restrict pro-kopf updates to premium users" ON budget_items;

-- Note: The "Premium: Users can manage per-person costs" policy already handles this
-- and was optimized in a previous migration