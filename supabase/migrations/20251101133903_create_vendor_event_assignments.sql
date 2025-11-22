/*
  # Vendor Event Assignments - Mehrfachzuordnung von Dienstleistern zu Events

  ## Neue Tabellen
    - `vendor_event_assignments`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key -> vendors)
      - `timeline_event_id` (uuid, foreign key -> wedding_timeline)
      - `cost_allocation_percentage` (numeric) - Prozentsatz der Gesamtkosten
      - `allocated_cost` (numeric) - Zugewiesene Kosten für dieses Event
      - `notes` (text) - Notizen zur Zuordnung
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  ## Änderungen
    - Migriert bestehende vendor.timeline_event_id Daten in neue Tabelle
    - Behält timeline_event_id Spalte für Rückwärtskompatibilität (deprecated)
  
  ## Sicherheit
    - RLS aktiviert für `vendor_event_assignments`
    - Policies für authentifizierte Benutzer basierend auf wedding_id
    - Indizes für Performance-Optimierung
*/

-- Create vendor_event_assignments table
CREATE TABLE IF NOT EXISTS vendor_event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  timeline_event_id uuid NOT NULL REFERENCES wedding_timeline(id) ON DELETE CASCADE,
  cost_allocation_percentage numeric DEFAULT 0 CHECK (cost_allocation_percentage >= 0 AND cost_allocation_percentage <= 100),
  allocated_cost numeric DEFAULT 0 CHECK (allocated_cost >= 0),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, timeline_event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_event_assignments_vendor_id 
  ON vendor_event_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_event_assignments_timeline_event_id 
  ON vendor_event_assignments(timeline_event_id);

-- Enable RLS
ALTER TABLE vendor_event_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_event_assignments
CREATE POLICY "Users can view vendor event assignments for their weddings"
  ON vendor_event_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON v.wedding_id = w.id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create vendor event assignments for their weddings"
  ON vendor_event_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON v.wedding_id = w.id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vendor event assignments for their weddings"
  ON vendor_event_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON v.wedding_id = w.id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON v.wedding_id = w.id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vendor event assignments for their weddings"
  ON vendor_event_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN weddings w ON v.wedding_id = w.id
      WHERE v.id = vendor_event_assignments.vendor_id
      AND w.user_id = auth.uid()
    )
  );

-- Migrate existing vendor timeline_event_id data to new table
INSERT INTO vendor_event_assignments (vendor_id, timeline_event_id, allocated_cost, cost_allocation_percentage)
SELECT 
  id as vendor_id,
  timeline_event_id,
  COALESCE(total_cost, 0) as allocated_cost,
  100 as cost_allocation_percentage
FROM vendors
WHERE timeline_event_id IS NOT NULL
ON CONFLICT (vendor_id, timeline_event_id) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_vendor_event_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_vendor_event_assignments_updated_at
  BEFORE UPDATE ON vendor_event_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_event_assignments_updated_at();