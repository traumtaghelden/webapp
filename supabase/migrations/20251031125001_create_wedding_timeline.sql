/*
  # Hochzeitstag Timeline

  1. Neue Tabellen
    - `wedding_timeline`
      - `id` (uuid, primary key) - Eindeutige ID
      - `wedding_id` (uuid) - Referenz zur Hochzeit
      - `time` (time) - Uhrzeit des Events
      - `title` (text) - Titel des Timeline-Punktes
      - `description` (text, nullable) - Beschreibung
      - `location` (text, nullable) - Ort des Events
      - `duration_minutes` (integer) - Dauer in Minuten
      - `assigned_to` (text, nullable) - Verantwortliche Person
      - `order_index` (integer) - Sortierreihenfolge
      - `created_at` (timestamptz) - Erstellungszeitpunkt
      - `updated_at` (timestamptz) - Aktualisierungszeitpunkt

  2. Security
    - Enable RLS on `wedding_timeline` table
    - Users can manage timeline for their weddings
*/

CREATE TABLE IF NOT EXISTS wedding_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  time time NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  duration_minutes integer DEFAULT 30,
  assigned_to text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wedding_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeline for their weddings"
  ON wedding_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_timeline.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timeline events for their weddings"
  ON wedding_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_timeline.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline events for their weddings"
  ON wedding_timeline FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_timeline.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_timeline.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline events for their weddings"
  ON wedding_timeline FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_timeline.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_wedding_timeline_wedding_id ON wedding_timeline(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_timeline_order ON wedding_timeline(order_index);
CREATE INDEX IF NOT EXISTS idx_wedding_timeline_time ON wedding_timeline(time);