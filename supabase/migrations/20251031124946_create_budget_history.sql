/*
  # Budget-Historie und Tracking

  1. Neue Tabellen
    - `budget_history`
      - `id` (uuid, primary key) - Eindeutige ID
      - `wedding_id` (uuid) - Referenz zur Hochzeit
      - `budget_item_id` (uuid, nullable) - Referenz zum Budgetposten
      - `action` (text) - Art der Aktion (created, updated, deleted, payment_status_changed)
      - `field_changed` (text, nullable) - Welches Feld wurde geändert
      - `old_value` (text, nullable) - Alter Wert
      - `new_value` (text, nullable) - Neuer Wert
      - `changed_by` (uuid) - Benutzer, der die Änderung vorgenommen hat
      - `created_at` (timestamptz) - Zeitpunkt der Änderung

  2. Security
    - Enable RLS on `budget_history` table
    - Users can view history for their weddings
    - System can insert history entries
*/

CREATE TABLE IF NOT EXISTS budget_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE SET NULL,
  action text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget history for their weddings"
  ON budget_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_history.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert budget history"
  ON budget_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_budget_history_wedding_id ON budget_history(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_budget_item_id ON budget_history(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_created_at ON budget_history(created_at DESC);

CREATE OR REPLACE FUNCTION log_budget_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'created', 'item_created', NEW.item_name, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.actual_cost != NEW.actual_cost THEN
      INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.wedding_id, NEW.id, 'updated', 'actual_cost', OLD.actual_cost::text, NEW.actual_cost::text, auth.uid());
    END IF;
    IF OLD.paid != NEW.paid THEN
      INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.wedding_id, NEW.id, 'payment_status_changed', 'paid', OLD.paid::text, NEW.paid::text, auth.uid());
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, changed_by)
    VALUES (OLD.wedding_id, OLD.id, 'deleted', 'item_deleted', OLD.item_name, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS budget_items_change_trigger ON budget_items;
CREATE TRIGGER budget_items_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION log_budget_change();