/*
  # Manuelle Zahlungsmarkierung für Free-Plan

  ## Änderungen
  
  1. Neue Spalte in `budget_items`
     - `is_manually_paid` (boolean) - Manuell als bezahlt markiert (nur Free-Plan)
     - Standardwert: `false`
     - Erlaubt Free-Nutzern, Zahlungen manuell als abgeschlossen zu markieren
  
  2. Funktionalität
     - Nur aktivierbar wenn `actual_cost` vorhanden ist (> 0)
     - Visuelles Feedback für bezahlte Posten
     - Unabhängig vom automatischen `payment_status`
  
  3. Sicherheit
     - RLS-Policies erlauben Update nur für eigene Wedding-Daten
     - Keine Berechtigungsprüfung nötig (Free-Feature)
*/

-- Füge Spalte für manuelle Zahlungsmarkierung hinzu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_items' AND column_name = 'is_manually_paid'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN is_manually_paid boolean DEFAULT false;
  END IF;
END $$;

-- Füge Index für Performance hinzu
CREATE INDEX IF NOT EXISTS idx_budget_items_manually_paid 
  ON budget_items(wedding_id, is_manually_paid) 
  WHERE is_manually_paid = true;

-- Kommentar zur Spalte
COMMENT ON COLUMN budget_items.is_manually_paid IS 
  'Manuelle Markierung als bezahlt für Free-Plan Nutzer. Nur aktivierbar wenn actual_cost > 0.';
