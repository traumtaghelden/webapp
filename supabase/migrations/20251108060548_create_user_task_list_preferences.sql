/*
  # Benutzereinstellungen für Aufgabenliste

  1. Neue Tabelle
    - `user_task_list_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key zu auth.users)
      - `wedding_id` (uuid, foreign key zu weddings)
      - `visible_columns` (jsonb) - Array von sichtbaren Spalten
      - `column_order` (jsonb) - Reihenfolge der Spalten
      - `column_widths` (jsonb) - Breiten der Spalten
      - `sort_config` (jsonb) - Sortierungskonfiguration
      - `saved_views` (jsonb) - Gespeicherte Filteransichten
      - `default_view` (text) - Standard-Ansicht beim Laden
      - `compact_mode` (boolean) - Kompakt-Modus aktiviert
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sicherheit
    - RLS aktiviert
    - Benutzer können nur ihre eigenen Einstellungen lesen/schreiben
*/

-- Tabelle erstellen
CREATE TABLE IF NOT EXISTS user_task_list_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  visible_columns jsonb DEFAULT '["checkbox", "title", "category", "priority", "due_date", "assigned_to", "status", "actions"]'::jsonb,
  column_order jsonb DEFAULT '["checkbox", "title", "category", "priority", "due_date", "assigned_to", "status", "actions"]'::jsonb,
  column_widths jsonb DEFAULT '{}'::jsonb,
  sort_config jsonb DEFAULT '{"primary": "smart_priority", "direction": "asc"}'::jsonb,
  saved_views jsonb DEFAULT '[]'::jsonb,
  default_view text DEFAULT 'all',
  compact_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wedding_id)
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_user_task_prefs_user_wedding 
  ON user_task_list_preferences(user_id, wedding_id);

-- RLS aktivieren
ALTER TABLE user_task_list_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Benutzer können eigene Task-Einstellungen lesen"
  ON user_task_list_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Benutzer können eigene Task-Einstellungen erstellen"
  ON user_task_list_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Benutzer können eigene Task-Einstellungen aktualisieren"
  ON user_task_list_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Benutzer können eigene Task-Einstellungen löschen"
  ON user_task_list_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_user_task_list_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_task_list_preferences_updated_at
  BEFORE UPDATE ON user_task_list_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_task_list_preferences_updated_at();
