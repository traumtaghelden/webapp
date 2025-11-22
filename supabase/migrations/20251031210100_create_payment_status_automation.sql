/*
  # Zahlungsplan-Automatisierung

  ## Beschreibung
  Erstellt automatische Trigger zur Aktualisierung des payment_status in budget_items
  basierend auf den verknüpften budget_payments.

  ## Neue Funktionen
  1. **update_budget_item_payment_status** - Berechnet automatisch den Status
  2. **check_overdue_payments** - Prüft auf überfällige Zahlungen

  ## Logik
  - `paid`: Alle Zahlungen sind bezahlt und Gesamtsumme >= actual_cost
  - `partial`: Einige Zahlungen sind bezahlt, aber nicht alle
  - `overdue`: Zahlungen mit due_date in der Vergangenheit und Status != paid
  - `pending`: Standard für neue oder ausstehende Zahlungen

  ## Sicherheit
  - Verwendet SECURITY DEFINER für Trigger-Funktionen
*/

-- Funktion zur Aktualisierung des Payment Status
CREATE OR REPLACE FUNCTION update_budget_item_payment_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_budget_item_id uuid;
  v_total_amount numeric;
  v_total_paid numeric;
  v_pending_count integer;
  v_paid_count integer;
  v_overdue_count integer;
  v_actual_cost numeric;
  v_new_status text;
  v_all_paid boolean;
BEGIN
  -- Bestimme die budget_item_id (je nach Operation)
  IF TG_OP = 'DELETE' THEN
    v_budget_item_id := OLD.budget_item_id;
  ELSE
    v_budget_item_id := NEW.budget_item_id;
  END IF;

  -- Hole den actual_cost des Budget-Postens
  SELECT actual_cost INTO v_actual_cost
  FROM budget_items
  WHERE id = v_budget_item_id;

  -- Berechne die Summen und Zählungen
  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
    COUNT(CASE WHEN status = 'pending' THEN 1 END),
    COUNT(CASE WHEN status = 'paid' THEN 1 END),
    COUNT(CASE WHEN status = 'overdue' OR (status = 'pending' AND due_date < CURRENT_DATE) THEN 1 END)
  INTO v_total_amount, v_total_paid, v_pending_count, v_paid_count, v_overdue_count
  FROM budget_payments
  WHERE budget_item_id = v_budget_item_id
    AND status != 'cancelled';

  -- Bestimme den neuen Status
  IF v_overdue_count > 0 THEN
    v_new_status := 'overdue';
    v_all_paid := false;
  ELSIF v_paid_count > 0 AND v_pending_count = 0 AND v_total_paid >= v_actual_cost THEN
    v_new_status := 'paid';
    v_all_paid := true;
  ELSIF v_paid_count > 0 AND v_pending_count > 0 THEN
    v_new_status := 'partial';
    v_all_paid := false;
  ELSIF v_paid_count > 0 THEN
    v_new_status := 'partial';
    v_all_paid := false;
  ELSE
    v_new_status := 'pending';
    v_all_paid := false;
  END IF;

  -- Aktualisiere den Budget-Posten
  UPDATE budget_items
  SET
    payment_status = v_new_status,
    paid = v_all_paid
  WHERE id = v_budget_item_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger für budget_payments INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS payment_status_update_trigger ON budget_payments;
CREATE TRIGGER payment_status_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budget_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_item_payment_status();

-- Funktion zur täglichen Überprüfung überfälliger Zahlungen
CREATE OR REPLACE FUNCTION check_overdue_payments()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Aktualisiere Status von Zahlungen, die überfällig sind
  UPDATE budget_payments
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;

  -- Aktualisiere payment_status der betroffenen Budget-Posten
  UPDATE budget_items bi
  SET payment_status = 'overdue'
  WHERE EXISTS (
    SELECT 1
    FROM budget_payments bp
    WHERE bp.budget_item_id = bi.id
      AND bp.status = 'overdue'
      AND bi.payment_status != 'paid'
  );
END;
$$;

-- Funktion zur automatischen Berechnung des payment_status beim Hinzufügen/Ändern von actual_cost
CREATE OR REPLACE FUNCTION sync_payment_status_on_cost_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_paid numeric;
BEGIN
  -- Berechne die Summe aller bezahlten Zahlungen
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM budget_payments
  WHERE budget_item_id = NEW.id
    AND status = 'paid';

  -- Wenn actual_cost geändert wurde und es bezahlte Zahlungen gibt
  IF OLD.actual_cost != NEW.actual_cost AND v_total_paid > 0 THEN
    IF v_total_paid >= NEW.actual_cost THEN
      NEW.payment_status := 'paid';
      NEW.paid := true;
    ELSIF v_total_paid > 0 THEN
      NEW.payment_status := 'partial';
      NEW.paid := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger für budget_items UPDATE
DROP TRIGGER IF EXISTS budget_item_cost_change_trigger ON budget_items;
CREATE TRIGGER budget_item_cost_change_trigger
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  WHEN (OLD.actual_cost IS DISTINCT FROM NEW.actual_cost)
  EXECUTE FUNCTION sync_payment_status_on_cost_change();
