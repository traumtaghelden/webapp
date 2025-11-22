/*
  # Timeline Event Guest Attendance System

  1. Neue Tabelle: timeline_event_guest_attendance
    - `id` (uuid, primary key) - Eindeutige ID
    - `timeline_event_id` (uuid, foreign key) - Referenz zum Timeline Event
    - `guest_id` (uuid, foreign key) - Referenz zum Gast
    - `is_attending` (boolean, default true) - Nimmt der Gast an diesem Event teil?
    - `created_at` (timestamptz) - Erstellungszeitpunkt
    - `updated_at` (timestamptz) - Aktualisierungszeitpunkt

  2. Constraints:
    - Unique constraint auf (timeline_event_id, guest_id) - Ein Gast kann nur einmal pro Event eingetragen sein
    - Foreign Keys mit CASCADE DELETE - Beim Löschen von Events oder Gästen werden Einträge automatisch gelöscht

  3. Sicherheit:
    - RLS aktiviert für timeline_event_guest_attendance
    - Policies für authenticated users basierend auf wedding_id über Joins
    - Nur Eigentümer der Hochzeit können Teilnahme verwalten

  4. Indizes für Performance:
    - Index auf timeline_event_id für schnelle Event-Abfragen
    - Index auf guest_id für schnelle Gast-Abfragen
    - Index auf is_attending für Filterung

  5. Funktionen:
    - Automatisches Setzen von updated_at via Trigger
    - Helper-Funktion zum Automatischen Erstellen von Attendance-Einträgen

  6. Notes:
    - Standardmäßig nehmen ALLE Gäste an ALLEN Events teil (is_attending = true)
    - Benutzer können gezielt Gäste von Events austragen
    - System beeinflusst KEINE Budget-Berechnungen
*/

-- Erstelle timeline_event_guest_attendance Tabelle
CREATE TABLE IF NOT EXISTS timeline_event_guest_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_event_id uuid NOT NULL REFERENCES wedding_timeline(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  is_attending boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_event_guest UNIQUE (timeline_event_id, guest_id)
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_timeline_event_guest_attendance_event_id 
  ON timeline_event_guest_attendance(timeline_event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_guest_attendance_guest_id 
  ON timeline_event_guest_attendance(guest_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_guest_attendance_is_attending 
  ON timeline_event_guest_attendance(is_attending) WHERE is_attending = true;

-- Aktiviere Row Level Security
ALTER TABLE timeline_event_guest_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users können attendance für ihre Hochzeiten lesen
CREATE POLICY "Users can view guest attendance for their weddings"
  ON timeline_event_guest_attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline
      INNER JOIN weddings ON weddings.id = wedding_timeline.wedding_id
      WHERE wedding_timeline.id = timeline_event_guest_attendance.timeline_event_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policy: Users können attendance für ihre Hochzeiten erstellen
CREATE POLICY "Users can create guest attendance for their weddings"
  ON timeline_event_guest_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline
      INNER JOIN weddings ON weddings.id = wedding_timeline.wedding_id
      WHERE wedding_timeline.id = timeline_event_guest_attendance.timeline_event_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policy: Users können attendance für ihre Hochzeiten aktualisieren
CREATE POLICY "Users can update guest attendance for their weddings"
  ON timeline_event_guest_attendance
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline
      INNER JOIN weddings ON weddings.id = wedding_timeline.wedding_id
      WHERE wedding_timeline.id = timeline_event_guest_attendance.timeline_event_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline
      INNER JOIN weddings ON weddings.id = wedding_timeline.wedding_id
      WHERE wedding_timeline.id = timeline_event_guest_attendance.timeline_event_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policy: Users können attendance für ihre Hochzeiten löschen
CREATE POLICY "Users can delete guest attendance for their weddings"
  ON timeline_event_guest_attendance
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline
      INNER JOIN weddings ON weddings.id = wedding_timeline.wedding_id
      WHERE wedding_timeline.id = timeline_event_guest_attendance.timeline_event_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_timeline_event_guest_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_timeline_event_guest_attendance_updated_at 
  ON timeline_event_guest_attendance;
CREATE TRIGGER trigger_update_timeline_event_guest_attendance_updated_at
  BEFORE UPDATE ON timeline_event_guest_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_timeline_event_guest_attendance_updated_at();

-- Funktion zum automatischen Erstellen von Attendance-Einträgen für neue Events
-- Wenn ein neues Event erstellt wird, werden automatisch Einträge für alle Gäste angelegt
CREATE OR REPLACE FUNCTION create_attendance_for_new_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Füge Attendance-Einträge für alle Gäste dieser Hochzeit hinzu
  INSERT INTO timeline_event_guest_attendance (timeline_event_id, guest_id, is_attending)
  SELECT NEW.id, guests.id, true
  FROM guests
  WHERE guests.wedding_id = NEW.wedding_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_attendance_for_new_event ON wedding_timeline;
CREATE TRIGGER trigger_create_attendance_for_new_event
  AFTER INSERT ON wedding_timeline
  FOR EACH ROW
  EXECUTE FUNCTION create_attendance_for_new_event();

-- Funktion zum automatischen Erstellen von Attendance-Einträgen für neue Gäste
-- Wenn ein neuer Gast erstellt wird, werden automatisch Einträge für alle Events angelegt
CREATE OR REPLACE FUNCTION create_attendance_for_new_guest()
RETURNS TRIGGER AS $$
BEGIN
  -- Füge Attendance-Einträge für alle Events dieser Hochzeit hinzu
  INSERT INTO timeline_event_guest_attendance (timeline_event_id, guest_id, is_attending)
  SELECT wedding_timeline.id, NEW.id, true
  FROM wedding_timeline
  WHERE wedding_timeline.wedding_id = NEW.wedding_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_attendance_for_new_guest ON guests;
CREATE TRIGGER trigger_create_attendance_for_new_guest
  AFTER INSERT ON guests
  FOR EACH ROW
  EXECUTE FUNCTION create_attendance_for_new_guest();