/*
  # Cleanup Budget Items RLS Policies

  1. Problem
    - Viele duplizierte Policies auf budget_items
    - Konflikte zwischen PERMISSIVE und RESTRICTIVE Policies

  2. Lösung
    - Entferne ALLE alten Policies
    - Erstelle saubere neue Policies:
      * 1x SELECT
      * 1x INSERT + 1x RESTRICTIVE (Premium-Check)
      * 1x UPDATE + 1x RESTRICTIVE (Premium-Check)
      * 1x DELETE
*/

-- Entferne alle alten Policies
DROP POLICY IF EXISTS "Users can view budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can view their budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items for their wedding" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items for their weddings" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update their budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete their budget items" ON budget_items;
DROP POLICY IF EXISTS "Restrict pro-kopf features to premium users" ON budget_items;
DROP POLICY IF EXISTS "Restrict pro-kopf updates to premium users" ON budget_items;
DROP POLICY IF EXISTS "budget_items_insert_check_premium_per_person" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update_check_premium_per_person" ON budget_items;
DROP POLICY IF EXISTS "budget_items_prokopf_insert_check" ON budget_items;
DROP POLICY IF EXISTS "budget_items_prokopf_update_check" ON budget_items;

-- Erstelle neue saubere Policies
CREATE POLICY "budget_items_select"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "budget_items_insert"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "budget_items_update"
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

CREATE POLICY "budget_items_delete"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RESTRICTIVE Policies für Premium-Features
CREATE POLICY "budget_items_premium_insert"
  ON budget_items
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Erlaube wenn NICHT Pro-Kopf verwendet wird
    (is_per_person IS NULL OR is_per_person = false)
    OR
    -- Erlaube wenn Pro-Kopf UND User ist Premium
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

CREATE POLICY "budget_items_premium_update"
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
        AND weddings.user_id = auth.uid()
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
        AND weddings.user_id = auth.uid()
        AND weddings.is_premium = true
      )
    )
  );
