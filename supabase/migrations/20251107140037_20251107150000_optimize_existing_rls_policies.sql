/*
  # Optimize Existing RLS Policies for Performance

  This migration addresses Supabase database linter performance warnings by optimizing
  Row Level Security (RLS) policies for the currently existing tables.
  
  ## Performance Issue
  
  The current RLS policies call `auth.uid()` directly, which causes PostgreSQL to
  re-evaluate the authentication function for EVERY ROW checked. This creates
  significant performance overhead when querying tables with many rows.
  
  ## Solution
  
  Wrap all `auth.uid()` calls with `(select auth.uid())` to force PostgreSQL to
  evaluate the function ONCE per query instead of once per row. This is achieved
  by using a subquery that PostgreSQL can optimize.
  
  ## Tables Optimized
  
  1. weddings - 4 policies (SELECT, INSERT, UPDATE, DELETE)
  2. budget_categories - 4 policies (SELECT, INSERT, UPDATE, DELETE)
  3. budget_items - 6 policies (SELECT, INSERT, UPDATE, DELETE + 2 restrictive)
  4. budget_payments - 4 policies (SELECT, INSERT, UPDATE, DELETE)
  
  ## Performance Impact
  
  - Reduces CPU usage for all authenticated queries
  - Improves query response time, especially for large datasets
  - Scales better as the number of rows increases
  - No functional changes - security rules remain identical
  
  ## Migration Strategy
  
  1. Drop existing policies
  2. Recreate them with optimized auth.uid() calls
  3. Maintain exact same logic and security guarantees
*/

-- =====================================================
-- WEDDINGS TABLE
-- =====================================================

DROP POLICY IF EXISTS "weddings_select_own" ON weddings;
DROP POLICY IF EXISTS "weddings_insert_own" ON weddings;
DROP POLICY IF EXISTS "weddings_update_own" ON weddings;
DROP POLICY IF EXISTS "weddings_delete_own" ON weddings;

CREATE POLICY "weddings_select_own" ON weddings
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "weddings_insert_own" ON weddings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "weddings_update_own" ON weddings
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "weddings_delete_own" ON weddings
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- BUDGET_CATEGORIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "budget_categories_select_own" ON budget_categories;
DROP POLICY IF EXISTS "budget_categories_insert_own" ON budget_categories;
DROP POLICY IF EXISTS "budget_categories_update_own" ON budget_categories;
DROP POLICY IF EXISTS "budget_categories_delete_own" ON budget_categories;

CREATE POLICY "budget_categories_select_own" ON budget_categories
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_categories_insert_own" ON budget_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_categories_update_own" ON budget_categories
  FOR UPDATE TO authenticated
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

CREATE POLICY "budget_categories_delete_own" ON budget_categories
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- BUDGET_ITEMS TABLE
-- =====================================================

DROP POLICY IF EXISTS "budget_items_select_own" ON budget_items;
DROP POLICY IF EXISTS "budget_items_insert_own" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update_own" ON budget_items;
DROP POLICY IF EXISTS "budget_items_delete_own" ON budget_items;
DROP POLICY IF EXISTS "budget_items_prokopf_insert_premium_only" ON budget_items;
DROP POLICY IF EXISTS "budget_items_prokopf_update_premium_only" ON budget_items;

CREATE POLICY "budget_items_select_own" ON budget_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_items_insert_own" ON budget_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_items_update_own" ON budget_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_items_delete_own" ON budget_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- Restrictive policies for premium features
CREATE POLICY "budget_items_prokopf_insert_premium_only" ON budget_items
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    is_per_person IS NULL
    OR is_per_person = false
    OR (
      is_per_person = true
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = budget_items.wedding_id
        AND weddings.user_id = (select auth.uid())
        AND weddings.is_premium = true
      )
    )
  );

CREATE POLICY "budget_items_prokopf_update_premium_only" ON budget_items
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    is_per_person IS NULL
    OR is_per_person = false
    OR (
      is_per_person = true
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = budget_items.wedding_id
        AND weddings.user_id = (select auth.uid())
        AND weddings.is_premium = true
      )
    )
  )
  WITH CHECK (
    is_per_person IS NULL
    OR is_per_person = false
    OR (
      is_per_person = true
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = budget_items.wedding_id
        AND weddings.user_id = (select auth.uid())
        AND weddings.is_premium = true
      )
    )
  );

-- =====================================================
-- BUDGET_PAYMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "budget_payments_select_own" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_insert_own" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_update_own" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_delete_own" ON budget_payments;

CREATE POLICY "budget_payments_select_own" ON budget_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_payments_insert_own" ON budget_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_payments_update_own" ON budget_payments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_payments_delete_own" ON budget_payments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );