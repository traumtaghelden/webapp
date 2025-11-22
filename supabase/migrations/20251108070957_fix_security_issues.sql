/*
  # Sicherheitsprobleme beheben

  1. Fehlende Indizes
    - Fügt Index für `user_task_list_preferences.wedding_id` hinzu

  2. RLS Performance-Optimierung
    - Optimiert alle RLS-Policies mit `(select auth.uid())`

  3. Nicht verwendete Indizes
    - Entfernt ungenutzte Indizes zur Performance-Verbesserung

  4. Mehrfache permissive Policies
    - Konsolidiert überlappende RLS-Policies

  5. Function Search Path
    - Sichert Funktionen mit `SECURITY DEFINER` und festem search_path ab
*/

-- =====================================================
-- 1. FEHLENDE INDIZES HINZUFÜGEN
-- =====================================================

-- Index für user_task_list_preferences.wedding_id
CREATE INDEX IF NOT EXISTS idx_user_task_prefs_wedding_id
  ON user_task_list_preferences(wedding_id);

-- =====================================================
-- 2. RLS POLICIES OPTIMIEREN
-- =====================================================

-- user_task_list_preferences: Policies neu erstellen mit optimiertem auth.uid()
DROP POLICY IF EXISTS "Benutzer können eigene Task-Einstellungen lesen" ON user_task_list_preferences;
DROP POLICY IF EXISTS "Benutzer können eigene Task-Einstellungen erstellen" ON user_task_list_preferences;
DROP POLICY IF EXISTS "Benutzer können eigene Task-Einstellungen aktualisieren" ON user_task_list_preferences;
DROP POLICY IF EXISTS "Benutzer können eigene Task-Einstellungen löschen" ON user_task_list_preferences;

CREATE POLICY "Benutzer können eigene Task-Einstellungen lesen"
  ON user_task_list_preferences
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Benutzer können eigene Task-Einstellungen erstellen"
  ON user_task_list_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Benutzer können eigene Task-Einstellungen aktualisieren"
  ON user_task_list_preferences
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Benutzer können eigene Task-Einstellungen löschen"
  ON user_task_list_preferences
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- 3. NICHT VERWENDETE INDIZES ENTFERNEN
-- =====================================================

DROP INDEX IF EXISTS idx_task_templates_wedding_type;
DROP INDEX IF EXISTS idx_budget_items_budget_category_id;
DROP INDEX IF EXISTS idx_task_comments_created_at;
DROP INDEX IF EXISTS idx_wedding_timeline_order;
DROP INDEX IF EXISTS idx_wedding_timeline_time;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_vendors_category;
DROP INDEX IF EXISTS idx_vendors_contract_status;
DROP INDEX IF EXISTS idx_task_attachments_created_at;
DROP INDEX IF EXISTS idx_guests_group_id;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_guest_communications_created_by;
DROP INDEX IF EXISTS idx_tasks_vendor_id;
DROP INDEX IF EXISTS idx_tasks_order_index;
DROP INDEX IF EXISTS idx_recurring_tasks_active;
DROP INDEX IF EXISTS idx_tasks_recurrence_parent;
DROP INDEX IF EXISTS idx_user_consent_type;
DROP INDEX IF EXISTS idx_legal_documents_type_active;
DROP INDEX IF EXISTS idx_cookie_preferences_session_id;
DROP INDEX IF EXISTS idx_deletion_requests_user_id;
DROP INDEX IF EXISTS idx_deletion_requests_status;
DROP INDEX IF EXISTS idx_budget_items_per_person;
DROP INDEX IF EXISTS idx_recurring_budget_items_active;
DROP INDEX IF EXISTS idx_budget_attachments_uploaded_by;
DROP INDEX IF EXISTS idx_budget_history_changed_by;
DROP INDEX IF EXISTS idx_task_attachments_uploaded_by;
DROP INDEX IF EXISTS idx_task_comments_user_id_fk;
DROP INDEX IF EXISTS idx_guests_response_type;
DROP INDEX IF EXISTS idx_guests_age_group;
DROP INDEX IF EXISTS idx_guests_is_vip;
DROP INDEX IF EXISTS idx_guests_invitation_status;
DROP INDEX IF EXISTS idx_guest_tag_assignments_tag_id;
DROP INDEX IF EXISTS idx_guests_is_family_head;
DROP INDEX IF EXISTS idx_guests_response_status;
DROP INDEX IF EXISTS idx_timeline_event_guest_attendance_is_attending;
DROP INDEX IF EXISTS idx_user_profiles_subscription_tier;
DROP INDEX IF EXISTS idx_vendor_activity_log_action_type;
DROP INDEX IF EXISTS idx_vendor_payments_due_date;
DROP INDEX IF EXISTS idx_vendor_payments_status;
DROP INDEX IF EXISTS idx_vendor_payments_payment_date;
DROP INDEX IF EXISTS idx_vendor_activity_log_created_at;
DROP INDEX IF EXISTS idx_vendor_activity_log_user_id;
DROP INDEX IF EXISTS idx_vendor_attachments_category;
DROP INDEX IF EXISTS idx_vendor_attachments_uploaded_by;
DROP INDEX IF EXISTS idx_budget_items_manually_paid;
DROP INDEX IF EXISTS idx_sync_log_created_at;
DROP INDEX IF EXISTS idx_sync_log_source;
DROP INDEX IF EXISTS idx_sync_log_target;
DROP INDEX IF EXISTS idx_activity_log_entity;
DROP INDEX IF EXISTS idx_activity_log_created_at;
DROP INDEX IF EXISTS idx_activity_log_related;
DROP INDEX IF EXISTS idx_budget_payments_type;
DROP INDEX IF EXISTS idx_budget_items_prokopf;

-- =====================================================
-- 4. MEHRFACHE PERMISSIVE POLICIES KONSOLIDIEREN
-- =====================================================

-- budget_items: Duplizierte Policies konsolidieren
DROP POLICY IF EXISTS "Premium: Users can manage per-person costs" ON budget_items;

-- task_dependencies: Duplizierte Policies entfernen
DROP POLICY IF EXISTS "Users can manage task dependencies for their weddings" ON task_dependencies;

-- task_subtasks: Duplizierte Policies entfernen
DROP POLICY IF EXISTS "Users can manage subtasks for their weddings" ON task_subtasks;

-- =====================================================
-- 5. FUNCTION SEARCH PATH SICHERN
-- =====================================================

-- update_user_task_list_preferences_updated_at
CREATE OR REPLACE FUNCTION update_user_task_list_preferences_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- calculate_per_person_total
DROP FUNCTION IF EXISTS calculate_per_person_total(uuid);

CREATE FUNCTION calculate_per_person_total(wedding_uuid uuid)
RETURNS numeric
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  total_per_person numeric;
  guest_count integer;
BEGIN
  -- Anzahl der bestätigten Gäste zählen
  SELECT COUNT(*) INTO guest_count
  FROM guests
  WHERE wedding_id = wedding_uuid
    AND invitation_status = 'confirmed';

  -- Wenn keine Gäste, 0 zurückgeben
  IF guest_count = 0 THEN
    RETURN 0;
  END IF;

  -- Pro-Kopf-Kosten berechnen
  SELECT COALESCE(SUM(
    CASE
      WHEN per_person_calculation THEN estimated_cost
      ELSE 0
    END
  ), 0) INTO total_per_person
  FROM budget_items
  WHERE wedding_id = wedding_uuid;

  RETURN total_per_person / guest_count;
END;
$$;

-- get_monthly_payments
DROP FUNCTION IF EXISTS get_monthly_payments(uuid, date);

CREATE FUNCTION get_monthly_payments(p_wedding_id uuid, p_month date)
RETURNS TABLE(
  month date,
  total_due numeric,
  total_paid numeric,
  payment_count integer,
  vendor_count integer
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_month as month,
    COALESCE(SUM(vp.amount), 0) as total_due,
    COALESCE(SUM(CASE WHEN vp.payment_status = 'paid' THEN vp.amount ELSE 0 END), 0) as total_paid,
    COUNT(vp.id)::integer as payment_count,
    COUNT(DISTINCT vp.vendor_id)::integer as vendor_count
  FROM vendor_payments vp
  WHERE vp.wedding_id = p_wedding_id
    AND date_trunc('month', vp.due_date) = date_trunc('month', p_month);
END;
$$;

-- create_default_budget_categories
DROP FUNCTION IF EXISTS create_default_budget_categories(uuid);

CREATE FUNCTION create_default_budget_categories(wedding_uuid uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- Standard-Budgetkategorien erstellen
  INSERT INTO budget_categories (wedding_id, name, color, icon, sort_order)
  VALUES
    (wedding_uuid, 'Location', '#3b82f6', '🏛️', 1),
    (wedding_uuid, 'Catering', '#ef4444', '🍽️', 2),
    (wedding_uuid, 'Dekoration', '#ec4899', '🎨', 3),
    (wedding_uuid, 'Fotografie', '#f59e0b', '📸', 4),
    (wedding_uuid, 'Musik', '#06b6d4', '🎵', 5),
    (wedding_uuid, 'Blumen', '#10b981', '💐', 6),
    (wedding_uuid, 'Kleidung', '#a855f7', '👗', 7),
    (wedding_uuid, 'Einladungen', '#84cc16', '✉️', 8),
    (wedding_uuid, 'Transport', '#14b8a6', '🚗', 9),
    (wedding_uuid, 'Sonstiges', '#6b7280', '📦', 10)
  ON CONFLICT (wedding_id, name) DO NOTHING;
END;
$$;

-- =====================================================
-- KOMMENTAR ZUR LEAKED PASSWORD PROTECTION
-- =====================================================

-- HINWEIS: "Leaked Password Protection" kann nur über die Supabase-Konsole
-- unter Authentication > Settings aktiviert werden. Dies ist keine
-- SQL-Einstellung und muss manuell in der UI aktiviert werden.
-- Empfehlung: Diese Funktion sollte in Produktion aktiviert werden.
