/*
  # Budget Premium Features RLS-Policies

  1. Zweck
    - Beschränkt Free-Plan-Nutzer daran, Premium-Budget-Features zu verwenden
    - Verhindert Erstellung von Budget-Posten mit Pro-Kopf-Kalkulation für Free-User
    - Verhindert Erstellung von Zahlungsplan-Einträgen für Free-User
    - Gewährleistet Datenintegrität auf Datenbankebene

  2. Neue Policies
    - `budget_items_check_premium_per_person`: Verhindert is_per_person=true für Free-User
    - `budget_payments_check_premium`: Verhindert Zahlungsplan-Erstellung für Free-User
    - Premium-User (subscription_tier='premium') haben uneingeschränkten Zugriff
    - Free-User (subscription_tier='free' oder NULL) können keine Premium-Features nutzen

  3. Sicherheit
    - Policies werden als RESTRICTIVE hinzugefügt (zusätzlich zu bestehenden Policies)
    - Fehlerhafte Anfragen werden mit klarer Fehlermeldung abgelehnt
    - Premium-Status wird aus user_profiles.subscription_tier geprüft
*/

-- Policy: Verhindert Pro-Kopf-Kalkulation für Free-User bei INSERT
CREATE POLICY "budget_items_insert_check_premium_per_person"
ON budget_items
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Erlaube, wenn is_per_person false ist (normaler Budget-Eintrag)
  is_per_person = false
  OR
  -- Oder wenn User Premium-Subscription hat
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Policy: Verhindert Pro-Kopf-Kalkulation für Free-User bei UPDATE
CREATE POLICY "budget_items_update_check_premium_per_person"
ON budget_items
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Erlaube Update nur wenn is_per_person false bleibt oder User Premium hat
  is_per_person = false
  OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
)
WITH CHECK (
  -- Erlaube Änderung nur wenn is_per_person false wird oder User Premium hat
  is_per_person = false
  OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Policy: Verhindert Zahlungsplan-Erstellung für Free-User
CREATE POLICY "budget_payments_insert_check_premium"
ON budget_payments
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Erlaube Zahlungsplan-Einträge nur für Premium-User
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Policy: Verhindert Zahlungsplan-Updates für Free-User
CREATE POLICY "budget_payments_update_check_premium"
ON budget_payments
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Erlaube Updates nur für Premium-User
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Kommentar hinzufügen zur Dokumentation
COMMENT ON POLICY "budget_items_insert_check_premium_per_person" ON budget_items IS
'Verhindert dass Free-User Budget-Posten mit Pro-Kopf-Kalkulation (is_per_person=true) erstellen. Premium-User haben uneingeschränkten Zugriff.';

COMMENT ON POLICY "budget_items_update_check_premium_per_person" ON budget_items IS
'Verhindert dass Free-User Pro-Kopf-Kalkulation bei bestehenden Budget-Posten aktivieren. Premium-User haben uneingeschränkten Zugriff.';

COMMENT ON POLICY "budget_payments_insert_check_premium" ON budget_payments IS
'Verhindert dass Free-User Zahlungsplan-Einträge erstellen. Zahlungspläne sind ein Premium-Feature.';

COMMENT ON POLICY "budget_payments_update_check_premium" ON budget_payments IS
'Verhindert dass Free-User Zahlungsplan-Einträge bearbeiten. Zahlungspläne sind ein Premium-Feature.';
