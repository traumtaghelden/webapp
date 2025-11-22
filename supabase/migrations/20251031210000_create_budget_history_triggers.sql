/*
  # Budget-Historie Automatisches Logging

  ## Beschreibung
  Erstellt automatische Trigger für die budget_history Tabelle, die alle Änderungen
  an budget_items tracken.

  ## Neue Funktionen
  1. **log_budget_item_creation** - Trigger für INSERT
  2. **log_budget_item_update** - Trigger für UPDATE
  3. **log_budget_item_deletion** - Trigger für DELETE

  ## Sicherheit
  - Verwendet SECURITY DEFINER für Trigger-Funktionen
  - Erfasst auth.uid() für changed_by Feld
*/

-- Funktion für neue Budget-Posten
CREATE OR REPLACE FUNCTION log_budget_item_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO budget_history (
    wedding_id,
    budget_item_id,
    action,
    field_changed,
    old_value,
    new_value,
    changed_by
  ) VALUES (
    NEW.wedding_id,
    NEW.id,
    'created',
    'item_name',
    NULL,
    NEW.item_name,
    auth.uid()
  );

  RETURN NEW;
END;
$$;

-- Funktion für Budget-Posten Änderungen
CREATE OR REPLACE FUNCTION log_budget_item_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Logge Änderungen an wichtigen Feldern
  IF OLD.item_name != NEW.item_name THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'updated', 'item_name', OLD.item_name, NEW.item_name, auth.uid());
  END IF;

  IF OLD.estimated_cost != NEW.estimated_cost THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'updated', 'estimated_cost', OLD.estimated_cost::text, NEW.estimated_cost::text, auth.uid());
  END IF;

  IF OLD.actual_cost != NEW.actual_cost THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'updated', 'actual_cost', OLD.actual_cost::text, NEW.actual_cost::text, auth.uid());
  END IF;

  IF OLD.paid != NEW.paid THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'payment_status_changed', 'paid', OLD.paid::text, NEW.paid::text, auth.uid());
  END IF;

  IF OLD.payment_status != NEW.payment_status THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'updated', 'payment_status', OLD.payment_status, NEW.payment_status, auth.uid());
  END IF;

  IF OLD.category != NEW.category THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'updated', 'category', OLD.category, NEW.category, auth.uid());
  END IF;

  IF OLD.priority != NEW.priority THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'updated', 'priority', OLD.priority, NEW.priority, auth.uid());
  END IF;

  IF (OLD.vendor_id IS NULL AND NEW.vendor_id IS NOT NULL) OR
     (OLD.vendor_id IS NOT NULL AND NEW.vendor_id IS NULL) OR
     (OLD.vendor_id IS NOT NULL AND NEW.vendor_id IS NOT NULL AND OLD.vendor_id != NEW.vendor_id) THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'updated', 'vendor_id', OLD.vendor_id::text, NEW.vendor_id::text, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

-- Funktion für gelöschte Budget-Posten
CREATE OR REPLACE FUNCTION log_budget_item_deletion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO budget_history (
    wedding_id,
    budget_item_id,
    action,
    field_changed,
    old_value,
    new_value,
    changed_by
  ) VALUES (
    OLD.wedding_id,
    OLD.id,
    'deleted',
    'item_name',
    OLD.item_name,
    NULL,
    auth.uid()
  );

  RETURN OLD;
END;
$$;

-- Trigger für INSERT erstellen
DROP TRIGGER IF EXISTS budget_item_creation_trigger ON budget_items;
CREATE TRIGGER budget_item_creation_trigger
  AFTER INSERT ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION log_budget_item_creation();

-- Trigger für UPDATE erstellen
DROP TRIGGER IF EXISTS budget_item_update_trigger ON budget_items;
CREATE TRIGGER budget_item_update_trigger
  AFTER UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION log_budget_item_update();

-- Trigger für DELETE erstellen
DROP TRIGGER IF EXISTS budget_item_deletion_trigger ON budget_items;
CREATE TRIGGER budget_item_deletion_trigger
  BEFORE DELETE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION log_budget_item_deletion();
