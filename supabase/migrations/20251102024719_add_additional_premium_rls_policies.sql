/*
  # Zusätzliche Premium Features RLS-Policies

  1. Zweck
    - Beschränkt Free-Plan-Nutzer bei zusätzlichen Premium-Features
    - Verhindert Erstellung von Familien-Gruppen für Free-User
    - Begrenzt Anzahl der Gäste-Gruppen auf 3 für Free-User
    - Verhindert Erstellung von Budget-Kategorien für Free-User
    - Gewährleistet Datenintegrität auf Datenbankebene

  2. Neue Policies
    - `family_groups_check_premium`: Verhindert Familie-Erstellung für Free-User
    - `guest_groups_check_premium_limit`: Begrenzt Gruppen auf 3 für Free-User
    - `budget_categories_check_premium`: Verhindert Kategorie-Erstellung für Free-User
    - Premium-User haben uneingeschränkten Zugriff

  3. Sicherheit
    - Policies werden als RESTRICTIVE hinzugefügt (zusätzlich zu bestehenden Policies)
    - Fehlerhafte Anfragen werden mit klarer Fehlermeldung abgelehnt
    - Premium-Status wird aus user_profiles.subscription_tier geprüft
*/

-- Policy: Verhindert Familie-Erstellung für Free-User
CREATE POLICY "family_groups_insert_check_premium"
ON family_groups
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Erlaube Familie-Erstellung nur für Premium-User
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Policy: Verhindert Familie-Updates für Free-User
CREATE POLICY "family_groups_update_check_premium"
ON family_groups
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

-- Policy: Begrenzt Gäste-Gruppen auf 3 für Free-User
CREATE POLICY "guest_groups_insert_check_premium_limit"
ON guest_groups
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Erlaube unbegrenzte Gruppen für Premium-User
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
  OR
  -- Für Free-User: Erlaube nur wenn weniger als 3 Gruppen vorhanden
  (
    SELECT COUNT(*) 
    FROM guest_groups gg
    INNER JOIN weddings w ON gg.wedding_id = w.id
    WHERE w.user_id = auth.uid()
  ) < 3
);

-- Policy: Verhindert Budget-Kategorie-Erstellung für Free-User
CREATE POLICY "budget_categories_insert_check_premium"
ON budget_categories
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Erlaube Kategorie-Erstellung nur für Premium-User
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'premium'
  )
);

-- Policy: Verhindert Budget-Kategorie-Updates für Free-User
CREATE POLICY "budget_categories_update_check_premium"
ON budget_categories
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

-- Kommentare zur Dokumentation
COMMENT ON POLICY "family_groups_insert_check_premium" ON family_groups IS
'Verhindert dass Free-User Familien-Gruppen erstellen. Familien-Verwaltung ist ein Premium-Feature.';

COMMENT ON POLICY "family_groups_update_check_premium" ON family_groups IS
'Verhindert dass Free-User Familien-Gruppen bearbeiten. Familien-Verwaltung ist ein Premium-Feature.';

COMMENT ON POLICY "guest_groups_insert_check_premium_limit" ON guest_groups IS
'Begrenzt Free-User auf maximal 3 Gäste-Gruppen. Premium-User haben unbegrenzte Gruppen.';

COMMENT ON POLICY "budget_categories_insert_check_premium" ON budget_categories IS
'Verhindert dass Free-User Budget-Kategorien erstellen. Kategorie-Verwaltung ist ein Premium-Feature.';

COMMENT ON POLICY "budget_categories_update_check_premium" ON budget_categories IS
'Verhindert dass Free-User Budget-Kategorien bearbeiten. Kategorie-Verwaltung ist ein Premium-Feature.';
