/*
  # Fix Budget Items und Vendors Schema Inkonsistenzen

  ## Beschreibung
  Diese Migration behebt kritische Schema-Inkonsistenzen zwischen Datenbank und TypeScript-Code:

  ## 1. Budget Items - Fehlende Felder
    - `budget_category_id` (uuid, foreign key) - Verknüpfung mit budget_categories Tabelle
      - Ermöglicht die Kategorisierung von Budget-Items
      - Foreign Key Constraint zu budget_categories
      - Index für Performance-Optimierung

  ## 2. Vendors - Fehlende Felder  
    - `description` (text) - Detaillierte Beschreibung des Dienstleisters
      - Wird in VendorComparisonModal und anderen Komponenten verwendet
      - Erlaubt umfangreiche Notizen zu Vendor-Details

  ## 3. Sicherheit
    - Keine RLS-Änderungen erforderlich (bestehende Policies decken neue Felder ab)
    - Foreign Key Constraints gewährleisten Datenintegrität

  ## Wichtige Hinweise
    - Bestehende Daten bleiben unverändert
    - budget_category_id ist nullable für Backward-Kompatibilität
    - description ist nullable für Backward-Kompatibilität
*/

-- Add budget_category_id to budget_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budget_items' 
    AND column_name = 'budget_category_id'
  ) THEN
    ALTER TABLE budget_items 
    ADD COLUMN budget_category_id uuid REFERENCES budget_categories(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_budget_items_budget_category_id 
    ON budget_items(budget_category_id);
  END IF;
END $$;

-- Add description to vendors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE vendors 
    ADD COLUMN description text;
  END IF;
END $$;
