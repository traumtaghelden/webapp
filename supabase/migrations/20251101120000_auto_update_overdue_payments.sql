/*
  # Automatische Überfällig-Markierung für Zahlungen

  1. Neue Funktionen
    - `update_overdue_payments()` - Markiert automatisch überfällige Zahlungen
    - Diese Funktion setzt den Status von 'pending' auf 'overdue' wenn das Fälligkeitsdatum überschritten ist

  2. Trigger
    - Trigger bei SELECT auf budget_payments, der automatisch überfällige Zahlungen aktualisiert
    - Wird bei jedem Zugriff auf die Tabelle ausgeführt

  3. Sicherheit
    - Funktion läuft mit SECURITY DEFINER, um RLS zu umgehen
    - Nur überfällige Zahlungen mit Status 'pending' werden aktualisiert
*/

-- Funktion zum Aktualisieren überfälliger Zahlungen
CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Aktualisiere alle Zahlungen, die überfällig sind
  UPDATE budget_payments
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;

-- Funktion die bei jedem SELECT ausgeführt wird
CREATE OR REPLACE FUNCTION check_overdue_on_select()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Führe die Aktualisierung aus
  PERFORM update_overdue_payments();
  RETURN NULL;
END;
$$;

-- Trigger für automatische Prüfung (wird bei Statement-Level ausgeführt)
DROP TRIGGER IF EXISTS auto_check_overdue_trigger ON budget_payments;
CREATE TRIGGER auto_check_overdue_trigger
  BEFORE SELECT ON budget_payments
  FOR EACH STATEMENT
  EXECUTE FUNCTION check_overdue_on_select();

-- Initiale Aktualisierung aller bestehenden überfälligen Zahlungen
SELECT update_overdue_payments();
