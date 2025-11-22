/*
  # Gästegruppen-Verwaltung

  1. Neue Tabellen
    - `guest_groups`
      - `id` (uuid, primary key) - Eindeutige ID
      - `wedding_id` (uuid) - Referenz zur Hochzeit
      - `name` (text) - Gruppenname
      - `color` (text) - Farbe für visuelle Unterscheidung
      - `description` (text, nullable) - Beschreibung der Gruppe
      - `created_at` (timestamptz) - Erstellungszeitpunkt

  2. Änderungen an bestehenden Tabellen
    - `guests` - Feld `group_id` hinzufügen

  3. Security
    - Enable RLS on `guest_groups` table
    - Users can manage groups for their weddings
*/

CREATE TABLE IF NOT EXISTS guest_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#d4af37',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups for their weddings"
  ON guest_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert groups for their weddings"
  ON guest_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update groups for their weddings"
  ON guest_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete groups for their weddings"
  ON guest_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_groups.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE guests ADD COLUMN group_id uuid REFERENCES guest_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_guest_groups_wedding_id ON guest_groups(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_group_id ON guests(group_id);