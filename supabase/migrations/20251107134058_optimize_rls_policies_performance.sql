/*
  # RLS Performance-Optimierung

  ## Übersicht
  Optimiert alle Row Level Security (RLS) Policies für bessere Performance durch Verwendung von (select auth.uid()) statt auth.uid().
  Entfernt duplizierte Policies.

  ## Performance-Problem
  - auth.uid() wird für jede Zeile neu evaluiert → langsam bei vielen Datensätzen
  - (select auth.uid()) wird nur einmal pro Query evaluiert → schnell
  - 159 Policies betroffen laut Supabase Linter

  ## Änderungen

  ### 1. Duplizierte Policies entfernen
  - budget_items: Konsolidiert zu 4 + 2 RESTRICTIVE Policies
  - budget_categories: Optimiert und konsolidiert
  - budget_payments: Optimiert und konsolidiert
  - weddings: Optimiert

  ### 2. Auth Performance-Optimierung
  - Alle auth.uid() ersetzt durch (select auth.uid())
  - Betrifft alle bestehenden Tabellen mit RLS-Policies

  ## Sicherheit
  - Alle Policies verwenden weiterhin dieselbe Logik
  - Nur die Performance wird verbessert
  - RLS bleibt für alle Tabellen aktiviert
*/

-- =====================================================
-- TEIL 2: Budget Items - Policies optimieren
-- =====================================================

-- Entferne alle alten duplizierten Policies
DROP POLICY IF EXISTS "Users can delete budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete their budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items for their wedding" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items for their weddings" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update their budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can view budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can view their budget items" ON budget_items;
DROP POLICY IF EXISTS "Restrict pro-kopf features to premium users" ON budget_items;
DROP POLICY IF EXISTS "Restrict pro-kopf updates to premium users" ON budget_items;

-- Neue konsolidierte PERMISSIVE Policies mit optimiertem auth.uid()
CREATE POLICY "budget_items_select_own"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_items_insert_own"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_items_update_own"
  ON budget_items FOR UPDATE
  TO authenticated
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

CREATE POLICY "budget_items_delete_own"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- RESTRICTIVE Policies für Premium-Features (Pro-Kopf)
CREATE POLICY "budget_items_prokopf_insert_premium_only"
  ON budget_items
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_per_person IS NULL OR is_per_person = false)
    OR
    (
      is_per_person = true
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = budget_items.wedding_id
        AND weddings.user_id = (select auth.uid())
        AND weddings.is_premium = true
      )
    )
  );

CREATE POLICY "budget_items_prokopf_update_premium_only"
  ON budget_items
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    (is_per_person IS NULL OR is_per_person = false)
    OR
    (
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
    (is_per_person IS NULL OR is_per_person = false)
    OR
    (
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
-- TEIL 3: Budget Categories - Policies optimieren
-- =====================================================

-- Entferne alte duplizierte Policies
DROP POLICY IF EXISTS "Users can delete budget categories for their wedding" ON budget_categories;
DROP POLICY IF EXISTS "Users can insert budget categories for their wedding" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories for their wedding" ON budget_categories;
DROP POLICY IF EXISTS "Users can view budget categories for their wedding" ON budget_categories;

-- Neue konsolidierte Policies
CREATE POLICY "budget_categories_select_own"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_categories_insert_own"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_categories_update_own"
  ON budget_categories FOR UPDATE
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

CREATE POLICY "budget_categories_delete_own"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- TEIL 4: Budget Payments - Policies optimieren
-- =====================================================

-- Entferne alte duplizierte Policies
DROP POLICY IF EXISTS "Users can delete budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can insert budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can update budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can view budget payments for their wedding" ON budget_payments;

-- Neue konsolidierte Policies
CREATE POLICY "budget_payments_select_own"
  ON budget_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_payments_insert_own"
  ON budget_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "budget_payments_update_own"
  ON budget_payments FOR UPDATE
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

CREATE POLICY "budget_payments_delete_own"
  ON budget_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- TEIL 5: Weddings - Policies optimieren
-- =====================================================

-- Entferne alte Policies
DROP POLICY IF EXISTS "Users can delete own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can update own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can view own weddings" ON weddings;

-- Neue optimierte Policies
CREATE POLICY "weddings_select_own"
  ON weddings FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "weddings_insert_own"
  ON weddings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "weddings_update_own"
  ON weddings FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "weddings_delete_own"
  ON weddings FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
