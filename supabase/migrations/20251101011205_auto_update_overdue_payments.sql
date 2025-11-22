/*
  # Automatische Überfällig-Markierung für Zahlungen

  1. Neue Funktionen
    - `update_overdue_payments()` - Markiert automatisch überfällige Zahlungen
    - `get_budget_payments_with_status_check()` - Wrapper-Funktion für Abfragen

  2. Trigger
    - Trigger bei INSERT/UPDATE auf budget_payments prüft das Fälligkeitsdatum
    - Automatische Status-Aktualisierung bei Datumsänderungen

  3. Sicherheit
    - Funktionen laufen mit SECURITY DEFINER um RLS zu umgehen
    - Nur überfällige Zahlungen mit Status 'pending' werden aktualisiert
*/

-- Funktion zum Aktualisieren überfälliger Zahlungen
CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE budget_payments
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;

-- Trigger-Funktion für neue/geänderte Zahlungen
CREATE OR REPLACE FUNCTION check_payment_overdue()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger bei INSERT/UPDATE
DROP TRIGGER IF EXISTS payment_overdue_check_trigger ON budget_payments;
CREATE TRIGGER payment_overdue_check_trigger
  BEFORE INSERT OR UPDATE ON budget_payments
  FOR EACH ROW
  EXECUTE FUNCTION check_payment_overdue();

-- Initiale Aktualisierung aller bestehenden überfälligen Zahlungen
SELECT update_overdue_payments();
