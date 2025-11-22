/*
  # Entferne alte duplizierte RLS Policies

  ## Übersicht
  Entfernt die alten RLS Policies die noch auth.uid() verwenden.
  Die neuen optimierten Policies mit (select auth.uid()) bleiben bestehen.

  ## Änderungen
  - Entfernt alte Policies von budget_categories (4 Policies)
  - Entfernt alte Policies von budget_items (3 Policies)
  - Entfernt alte Policies von budget_payments (4 Policies)

  ## Verbleibende Policies
  Nach dieser Migration verbleiben nur die optimierten *_own Policies mit (select auth.uid()).
*/

-- =====================================================
-- Budget Categories - Alte Policies entfernen
-- =====================================================

DROP POLICY IF EXISTS "Users can delete budget categories for their weddings" ON budget_categories;
DROP POLICY IF EXISTS "Users can insert budget categories for their weddings" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories for their weddings" ON budget_categories;
DROP POLICY IF EXISTS "Users can view budget categories for their weddings" ON budget_categories;

-- =====================================================
-- Budget Items - Alte Policies entfernen
-- =====================================================

DROP POLICY IF EXISTS "Users can delete budget items for their weddings" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items for their weddings" ON budget_items;
DROP POLICY IF EXISTS "Users can view budget items for their weddings" ON budget_items;

-- =====================================================
-- Budget Payments - Alte Policies entfernen
-- =====================================================

DROP POLICY IF EXISTS "Users can delete budget payments for their weddings" ON budget_payments;
DROP POLICY IF EXISTS "Users can insert budget payments for their weddings" ON budget_payments;
DROP POLICY IF EXISTS "Users can update budget payments for their weddings" ON budget_payments;
DROP POLICY IF EXISTS "Users can view budget payments for their weddings" ON budget_payments;
