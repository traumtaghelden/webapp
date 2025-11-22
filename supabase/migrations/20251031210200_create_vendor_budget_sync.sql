/*
  # Vendor-Budget-Synchronisation

  ## Beschreibung
  Erstellt automatische Trigger zur Synchronisation zwischen vendors und budget_items.
  Vendor-Felder (total_cost, paid_amount) werden automatisch aktualisiert.

  ## Neue Funktionen
  1. **sync_vendor_costs** - Synchronisiert Vendor-Kosten mit Budget-Posten
  2. **update_vendor_on_budget_change** - Trigger für Budget-Änderungen

  ## Sicherheit
  - Verwendet SECURITY DEFINER für Trigger-Funktionen
*/

-- Funktion zur Synchronisation der Vendor-Kosten
CREATE OR REPLACE FUNCTION sync_vendor_costs()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_vendor_id uuid;
  v_new_total_cost numeric;
  v_new_paid_amount numeric;
BEGIN
  -- Bestimme die vendor_id
  IF TG_OP = 'DELETE' THEN
    v_vendor_id := OLD.vendor_id;
  ELSE
    v_vendor_id := NEW.vendor_id;
  END IF;

  -- Wenn kein Vendor zugeordnet ist, nichts tun
  IF v_vendor_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Berechne die Summen für diesen Vendor
  SELECT
    COALESCE(SUM(actual_cost), 0),
    COALESCE(SUM(CASE WHEN paid = true THEN actual_cost ELSE 0 END), 0)
  INTO v_new_total_cost, v_new_paid_amount
  FROM budget_items
  WHERE vendor_id = v_vendor_id;

  -- Aktualisiere den Vendor
  UPDATE vendors
  SET
    total_cost = v_new_total_cost,
    paid_amount = v_new_paid_amount,
    updated_at = now()
  WHERE id = v_vendor_id;

  -- Wenn der Vendor geändert wurde (UPDATE von vendor_id), aktualisiere auch den alten Vendor
  IF TG_OP = 'UPDATE' AND OLD.vendor_id IS NOT NULL AND OLD.vendor_id != NEW.vendor_id THEN
    SELECT
      COALESCE(SUM(actual_cost), 0),
      COALESCE(SUM(CASE WHEN paid = true THEN actual_cost ELSE 0 END), 0)
    INTO v_new_total_cost, v_new_paid_amount
    FROM budget_items
    WHERE vendor_id = OLD.vendor_id;

    UPDATE vendors
    SET
      total_cost = v_new_total_cost,
      paid_amount = v_new_paid_amount,
      updated_at = now()
    WHERE id = OLD.vendor_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger für budget_items INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS vendor_cost_sync_trigger ON budget_items;
CREATE TRIGGER vendor_cost_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_vendor_costs();
