/*
  # Familie-Gästeverwaltung

  1. Neue Tabelle: family_groups
    - `id` (uuid, primary key)
    - `wedding_id` (uuid, foreign key zu weddings)
    - `family_name` (text) - z.B. "Familie Schmidt"
    - `notes` (text, optional) - Notizen zur Familie
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Änderungen an guests Tabelle:
    - `family_group_id` (uuid, optional, foreign key zu family_groups)
    - `is_family_head` (boolean, default false) - Hauptperson der Familie
    - `family_role` (text, optional) - z.B. "Elternteil", "Kind", "Partner"

  3. Sicherheit:
    - RLS aktiviert für family_groups
    - Policies für authenticated users basierend auf wedding_id
    - Kaskadierendes Löschen konfiguriert

  4. Indizes für Performance:
    - Index auf family_group_id in guests
    - Index auf wedding_id in family_groups
*/

-- Erstelle family_groups Tabelle
CREATE TABLE IF NOT EXISTS family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  family_name text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Füge neue Felder zur guests Tabelle hinzu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'family_group_id'
  ) THEN
    ALTER TABLE guests ADD COLUMN family_group_id uuid REFERENCES family_groups(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'is_family_head'
  ) THEN
    ALTER TABLE guests ADD COLUMN is_family_head boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'family_role'
  ) THEN
    ALTER TABLE guests ADD COLUMN family_role text;
  END IF;
END $$;

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_family_groups_wedding_id ON family_groups(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_family_group_id ON guests(family_group_id);
CREATE INDEX IF NOT EXISTS idx_guests_is_family_head ON guests(is_family_head) WHERE is_family_head = true;

-- Aktiviere Row Level Security
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users können family_groups ihrer Hochzeiten lesen
CREATE POLICY "Users can view family groups for their weddings"
  ON family_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policy: Users können family_groups für ihre Hochzeiten erstellen
CREATE POLICY "Users can create family groups for their weddings"
  ON family_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policy: Users können family_groups ihrer Hochzeiten aktualisieren
CREATE POLICY "Users can update family groups for their weddings"
  ON family_groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policy: Users können family_groups ihrer Hochzeiten löschen
CREATE POLICY "Users can delete family groups for their weddings"
  ON family_groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_family_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_family_groups_updated_at ON family_groups;
CREATE TRIGGER trigger_update_family_groups_updated_at
  BEFORE UPDATE ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_family_groups_updated_at();