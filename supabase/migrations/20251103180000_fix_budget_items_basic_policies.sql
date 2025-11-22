/*
  # Fix Budget Items Basic RLS Policies

  1. Probleme
    - Es fehlen grundlegende SELECT, INSERT, UPDATE, DELETE Policies
    - Duplizierte RESTRICTIVE Policies verursachen Konflikte
    - .select() nach .insert() schlägt fehl

  2. Änderungen
    - Entferne alle duplizierten Policies
    - Füge grundlegende PERMISSIVE Policies hinzu
    - Behalte RESTRICTIVE Premium-Checks bei
*/

-- Entferne alle alten duplizierten Policies
DROP POLICY IF EXISTS "budget_items_insert_check_premium_per_person" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update_check_premium_per_person" ON budget_items;
DROP POLICY IF EXISTS "budget_items_prokopf_insert_check" ON budget_items;
DROP POLICY IF EXISTS "budget_items_prokopf_update_check" ON budget_items;

-- Grundlegende PERMISSIVE Policies für authenticated users
CREATE POLICY "Users can view their budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget items for their wedding"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RESTRICTIVE Policy für Premium-Features (Pro-Kopf)
CREATE POLICY "Restrict pro-kopf features to premium users"
  ON budget_items
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if NOT using pro-kopf features (normal entry)
    (is_per_person IS NULL OR is_per_person = false)
    OR
    -- Allow if using pro-kopf AND user is premium
    (
      is_per_person = true
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = budget_items.wedding_id
        AND weddings.user_id = auth.uid()
        AND weddings.is_premium = true
      )
    )
  );

CREATE POLICY "Restrict pro-kopf updates to premium users"
  ON budget_items
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if NOT using pro-kopf features
    (is_per_person IS NULL OR is_per_person = false)
    OR
    -- Allow if using pro-kopf AND user is premium
    (
      is_per_person = true
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = budget_items.wedding_id
        AND weddings.user_id = auth.uid()
        AND weddings.is_premium = true
      )
    )
  )
  WITH CHECK (
    -- Same check for WITH CHECK
    (is_per_person IS NULL OR is_per_person = false)
    OR
    (
      is_per_person = true
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = budget_items.wedding_id
        AND weddings.user_id = auth.uid()
        AND weddings.is_premium = true
      )
    )
  );
