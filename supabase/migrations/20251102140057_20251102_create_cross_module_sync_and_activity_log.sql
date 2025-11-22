/*
  # Cross-Module Synchronisation und Aktivitäts-Log System

  ## Beschreibung
  Erweitert die bestehende Vendor-Budget-Synchronisation um Task und Timeline.
  Implementiert ein umfassendes Aktivitäts-Log-System für Nachvollziehbarkeit.

  ## 1. Neue Tabellen
    - `activity_log`
      - Zentrale Aktivitätsverfolgung für alle Module
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key)
      - `entity_type` (text) - task, budget, vendor, timeline
      - `entity_id` (uuid) - ID des betroffenen Eintrags
      - `action_type` (text) - created, updated, deleted, linked, status_changed, payment_made
      - `related_entity_type` (text) - Typ der verknüpften Entität
      - `related_entity_id` (uuid) - ID der verknüpften Entität
      - `details` (jsonb) - Details der Aktion
      - `created_at` (timestamptz)

  ## 2. Neue Funktionen
    - `log_activity()` - Zentrale Logging-Funktion
    - `sync_task_completion_to_payment()` - Task → Budget Zahlung Sync
    - `sync_payment_to_task()` - Budget Zahlung → Task Sync
    - `sync_timeline_date_to_task()` - Timeline → Task Datum Sync
    - `get_entity_activities()` - Aktivitäten für eine Entität abrufen

  ## 3. Trigger
    - Task completion → Budget payment status update
    - Budget payment status → Task completion update
    - Timeline event date change → Task due date update

  ## 4. Sicherheit
    - RLS auf activity_log aktiviert
    - Nur authenticated users können eigene Logs sehen
*/

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('task', 'budget', 'vendor', 'timeline', 'guest', 'payment')),
  entity_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'linked', 'unlinked', 'status_changed', 'payment_made', 'completed', 'date_changed')),
  related_entity_type text CHECK (related_entity_type IN ('task', 'budget', 'vendor', 'timeline', 'guest', 'payment')),
  related_entity_id uuid,
  actor_name text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_wedding_id ON activity_log(wedding_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_related ON activity_log(related_entity_type, related_entity_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs for their weddings"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = activity_log.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity logs for their weddings"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = activity_log.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_wedding_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action_type text,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_actor_name text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO activity_log (
    wedding_id,
    entity_type,
    entity_id,
    action_type,
    related_entity_type,
    related_entity_id,
    actor_name,
    details
  ) VALUES (
    p_wedding_id,
    p_entity_type,
    p_entity_id,
    p_action_type,
    p_related_entity_type,
    p_related_entity_id,
    p_actor_name,
    p_details
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Function to get activities for an entity
CREATE OR REPLACE FUNCTION get_entity_activities(
  p_entity_type text,
  p_entity_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  action_type text,
  related_entity_type text,
  related_entity_id uuid,
  actor_name text,
  details jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action_type,
    al.related_entity_type,
    al.related_entity_id,
    al.actor_name,
    al.details,
    al.created_at
  FROM activity_log al
  WHERE (al.entity_type = p_entity_type AND al.entity_id = p_entity_id)
     OR (al.related_entity_type = p_entity_type AND al.related_entity_id = p_entity_id)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Trigger function: Task completion → Budget payment update
CREATE OR REPLACE FUNCTION sync_task_completion_to_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget_item_id uuid;
  v_payment_id uuid;
  v_task_title text;
BEGIN
  -- Only process if task is now completed and has budget/vendor link
  IF NEW.completed = true AND OLD.completed = false THEN
    -- Check if task is linked to a budget item via vendor
    IF NEW.vendor_id IS NOT NULL THEN
      SELECT id INTO v_budget_item_id
      FROM budget_items
      WHERE vendor_id = NEW.vendor_id
      LIMIT 1;
      
      IF v_budget_item_id IS NOT NULL THEN
        -- Mark related payments as paid
        UPDATE budget_payments
        SET status = 'paid', payment_date = now()
        WHERE budget_item_id = v_budget_item_id
        AND status = 'pending'
        AND amount <= (SELECT actual_cost FROM budget_items WHERE id = v_budget_item_id)
        RETURNING id INTO v_payment_id;
        
        IF v_payment_id IS NOT NULL THEN
          -- Log the activity
          PERFORM log_activity(
            NEW.wedding_id,
            'task',
            NEW.id,
            'completed',
            'payment',
            v_payment_id,
            NULL,
            jsonb_build_object(
              'task_title', NEW.title,
              'auto_marked_paid', true
            )
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Budget payment → Task completion
CREATE OR REPLACE FUNCTION sync_payment_to_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id uuid;
  v_wedding_id uuid;
  v_task_record RECORD;
BEGIN
  -- Only process if payment is marked as paid
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Get vendor_id from budget_item
    SELECT vendor_id, wedding_id INTO v_vendor_id, v_wedding_id
    FROM budget_items
    WHERE id = NEW.budget_item_id;
    
    IF v_vendor_id IS NOT NULL THEN
      -- Find incomplete tasks linked to this vendor
      FOR v_task_record IN
        SELECT id, title
        FROM tasks
        WHERE vendor_id = v_vendor_id
        AND wedding_id = v_wedding_id
        AND completed = false
        AND (title ILIKE '%zahlung%' OR title ILIKE '%bezahl%' OR title ILIKE '%rate%')
      LOOP
        -- Mark task as completed
        UPDATE tasks
        SET completed = true, completed_at = now()
        WHERE id = v_task_record.id;
        
        -- Log the activity
        PERFORM log_activity(
          v_wedding_id,
          'payment',
          NEW.id,
          'payment_made',
          'task',
          v_task_record.id,
          NULL,
          jsonb_build_object(
            'task_auto_completed', true,
            'task_title', v_task_record.title,
            'payment_amount', NEW.amount
          )
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Timeline event date → Task due date
CREATE OR REPLACE FUNCTION sync_timeline_date_to_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_record RECORD;
BEGIN
  -- Only process if date has changed
  IF TG_OP = 'UPDATE' AND OLD.time != NEW.time THEN
    -- Update all tasks linked to this timeline event
    FOR v_task_record IN
      SELECT id, title, due_date
      FROM tasks
      WHERE timeline_event_id = NEW.id
    LOOP
      -- Update task due date
      UPDATE tasks
      SET due_date = NEW.time::date
      WHERE id = v_task_record.id;
      
      -- Log the activity
      PERFORM log_activity(
        NEW.wedding_id,
        'timeline',
        NEW.id,
        'date_changed',
        'task',
        v_task_record.id,
        NULL,
        jsonb_build_object(
          'old_date', OLD.time,
          'new_date', NEW.time,
          'task_title', v_task_record.title,
          'task_due_date_updated', true
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to log budget-vendor sync activities
CREATE OR REPLACE FUNCTION log_budget_vendor_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wedding_id uuid;
  v_action_details jsonb;
BEGIN
  IF TG_TABLE_NAME = 'budget_items' AND TG_OP = 'UPDATE' THEN
    IF OLD.paid != NEW.paid OR OLD.actual_cost != NEW.actual_cost THEN
      v_action_details := jsonb_build_object(
        'paid_changed', OLD.paid != NEW.paid,
        'cost_changed', OLD.actual_cost != NEW.actual_cost,
        'old_cost', OLD.actual_cost,
        'new_cost', NEW.actual_cost
      );
      
      -- Log budget update
      PERFORM log_activity(
        NEW.wedding_id,
        'budget',
        NEW.id,
        'updated',
        CASE WHEN NEW.vendor_id IS NOT NULL THEN 'vendor' ELSE NULL END,
        NEW.vendor_id,
        NULL,
        v_action_details
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS task_completion_sync_trigger ON tasks;
DROP TRIGGER IF EXISTS payment_to_task_sync_trigger ON budget_payments;
DROP TRIGGER IF EXISTS timeline_date_sync_trigger ON wedding_timeline;
DROP TRIGGER IF EXISTS budget_vendor_sync_log_trigger ON budget_items;

-- Create triggers
CREATE TRIGGER task_completion_sync_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_task_completion_to_payment();

CREATE TRIGGER payment_to_task_sync_trigger
  AFTER UPDATE ON budget_payments
  FOR EACH ROW
  EXECUTE FUNCTION sync_payment_to_task();

CREATE TRIGGER timeline_date_sync_trigger
  AFTER UPDATE ON wedding_timeline
  FOR EACH ROW
  EXECUTE FUNCTION sync_timeline_date_to_task();

CREATE TRIGGER budget_vendor_sync_log_trigger
  AFTER UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION log_budget_vendor_sync();

-- Add missing foreign key if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'timeline_event_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN timeline_event_id uuid REFERENCES wedding_timeline(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_tasks_timeline_event ON tasks(timeline_event_id);
  END IF;
END $$;