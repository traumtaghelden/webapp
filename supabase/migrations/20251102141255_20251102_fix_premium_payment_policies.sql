/*
  # Fix Premium Payment Policies & Pro-Kopf Features

  ## Beschreibung
  Schließt kritische Sicherheitslücken im Premium-Gating:
  - Verhindert, dass Free-User Payment Plans (milestone/monthly) erstellen
  - Verhindert, dass Free-User Pro-Kopf-Features nutzen
  - Sichert UPDATE-Operationen gegen Downgrade-Manipulation

  ## 1. Erweiterte budget_payments Policy
    - Milestone und monthly Payments nur für Premium
    - deposit und final für alle erlaubt
    - RESTRICTIVE Policy (zusätzlich zu bestehenden Policies)

  ## 2. Neue budget_items Pro-Kopf-Policies
    - INSERT: Verhindert Pro-Kopf-Features für Free-User
    - UPDATE: Verhindert nachträgliche Aktivierung für Free-User
    - Prüft is_per_person und cost_per_person Felder

  ## 3. Sicherheit
    - RESTRICTIVE Policies = zusätzlich zu normalen Policies
    - Beide müssen erfüllt sein (AND-Verknüpfung)
    - subscription_tier wird aus user_profiles geprüft
    - Fehlerhafte Requests werden mit Policy-Verletzung abgelehnt
*/

-- ============================================
-- 1. BUDGET_PAYMENTS: Erweiterte Policy
-- ============================================

-- Lösche alte restrictive Policy falls vorhanden
DROP POLICY IF EXISTS "budget_payments_insert_check_premium" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_update_check_premium" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_insert_check_premium_type" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_update_check_premium_type" ON budget_payments;

-- Neue Policy: Nur Premium kann milestone/monthly Payments erstellen
CREATE POLICY "budget_payments_insert_check_premium_type"
ON budget_payments
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Milestone und monthly nur für Premium-User
  (
    payment_type IN ('milestone', 'monthly') AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'premium'
    )
  )
  OR
  -- deposit und final für alle erlaubt
  (payment_type IN ('deposit', 'final') OR payment_type IS NULL)
);

-- Policy: UPDATE von milestone/monthly nur für Premium
CREATE POLICY "budget_payments_update_check_premium_type"
ON budget_payments
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Wenn zu milestone/monthly geändert wird, muss Premium sein
  (payment_type NOT IN ('milestone', 'monthly'))
  OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- ============================================
-- 2. BUDGET_ITEMS: Pro-Kopf-Feature-Protection
-- ============================================

DROP POLICY IF EXISTS "budget_items_prokopf_insert_check" ON budget_items;
DROP POLICY IF EXISTS "budget_items_prokopf_update_check" ON budget_items;

-- Policy: INSERT mit Pro-Kopf-Features nur für Premium
CREATE POLICY "budget_items_prokopf_insert_check"
ON budget_items
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Wenn Pro-Kopf-Features NICHT verwendet werden, erlauben
  (is_per_person IS FALSE OR is_per_person IS NULL)
  AND (cost_per_person IS NULL)
  OR
  -- Wenn Pro-Kopf-Features verwendet werden, muss Premium sein
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Policy: UPDATE zu Pro-Kopf nur für Premium
CREATE POLICY "budget_items_prokopf_update_check"
ON budget_items
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Wenn KEINE Pro-Kopf-Features verwendet werden, erlauben
  (is_per_person IS FALSE OR is_per_person IS NULL)
  AND (cost_per_person IS NULL)
  OR
  -- Wenn Pro-Kopf-Features verwendet werden, muss Premium sein
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- ============================================
-- 3. VENDOR_PAYMENTS: Premium-Check
-- ============================================

DROP POLICY IF EXISTS "vendor_payments_limit_free_user" ON vendor_payments;

-- Policy: Mehrere Vendor-Payments nur für Premium
CREATE POLICY "vendor_payments_limit_free_user"
ON vendor_payments
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Premium-User unbegrenzt
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
  OR
  -- Free-User: Max 1 Payment pro Vendor
  (
    SELECT COUNT(*)
    FROM vendor_payments vp
    WHERE vp.vendor_id = vendor_payments.vendor_id
  ) < 1
);

-- ============================================
-- 4. KOMMENTARE zur Dokumentation
-- ============================================

COMMENT ON POLICY "budget_payments_insert_check_premium_type" ON budget_payments IS
'RESTRICTIVE: Verhindert dass Free-User milestone oder monthly Payments erstellen. Diese Payment-Types sind Premium-Features (Ratenplanung).';

COMMENT ON POLICY "budget_payments_update_check_premium_type" ON budget_payments IS
'RESTRICTIVE: Verhindert dass Free-User bestehende Payments zu milestone/monthly ändern (Downgrade-Protection).';

COMMENT ON POLICY "budget_items_prokopf_insert_check" ON budget_items IS
'RESTRICTIVE: Verhindert dass Free-User Budget-Items mit Pro-Kopf-Kalkulation (is_per_person=true oder cost_per_person gesetzt) erstellen.';

COMMENT ON POLICY "budget_items_prokopf_update_check" ON budget_items IS
'RESTRICTIVE: Verhindert dass Free-User nachträglich Pro-Kopf-Features aktivieren (Downgrade-Protection und DevTools-Manipulation).';

COMMENT ON POLICY "vendor_payments_limit_free_user" ON vendor_payments IS
'RESTRICTIVE: Begrenzt Free-User auf maximal 1 Payment pro Vendor. Premium-User haben unbegrenzte Payments (Ratenplanung).';

-- ============================================
-- 5. INDEX für Performance
-- ============================================

-- Index auf payment_type für schnellere Policy-Checks
CREATE INDEX IF NOT EXISTS idx_budget_payments_type ON budget_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_prokopf ON budget_items(is_per_person) WHERE is_per_person = true;
