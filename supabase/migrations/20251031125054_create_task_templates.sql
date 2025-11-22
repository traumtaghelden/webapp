/*
  # Aufgaben-Vorlagen System

  1. Neue Tabellen
    - `task_templates`
      - `id` (uuid, primary key) - Eindeutige ID
      - `name` (text) - Name der Vorlage
      - `description` (text, nullable) - Beschreibung
      - `category` (text) - Kategorie der Vorlage
      - `wedding_type` (text) - Hochzeitstyp (traditional, modern, casual, etc.)
      - `tasks_json` (jsonb) - JSON-Array mit Aufgaben
      - `is_public` (boolean) - Öffentliche Vorlage oder privat
      - `created_by` (uuid, nullable) - Ersteller (null = System-Vorlage)
      - `created_at` (timestamptz) - Erstellungszeitpunkt

  2. Security
    - Enable RLS on `task_templates` table
    - Users can view public templates and their own templates
    - Users can insert their own templates
*/

CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  wedding_type text DEFAULT 'general',
  tasks_json jsonb NOT NULL,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public templates and their own templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can insert their own templates"
  ON task_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON task_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON task_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_task_templates_wedding_type ON task_templates(wedding_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_public ON task_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON task_templates(created_by);

INSERT INTO task_templates (name, description, category, wedding_type, tasks_json, is_public, created_by) VALUES
('Traditionelle Hochzeit Checkliste', 'Komplette Aufgabenliste für eine traditionelle Hochzeit', 'complete', 'traditional', '[
  {"title": "Location besichtigen und buchen", "category": "venue", "priority": "high", "notes": "Mindestens 12 Monate vorher"},
  {"title": "Standesamt Termin reservieren", "category": "general", "priority": "high", "notes": "Mindestens 6 Monate vorher"},
  {"title": "Catering auswählen und buchen", "category": "catering", "priority": "high", "notes": "9-12 Monate vorher"},
  {"title": "Fotograf buchen", "category": "photography", "priority": "high", "notes": "9-12 Monate vorher"},
  {"title": "DJ oder Band buchen", "category": "music", "priority": "high", "notes": "9-12 Monate vorher"},
  {"title": "Brautkleid kaufen", "category": "dress", "priority": "high", "notes": "6-9 Monate vorher"},
  {"title": "Anzug kaufen oder mieten", "category": "dress", "priority": "medium", "notes": "6-9 Monate vorher"},
  {"title": "Einladungen designen und bestellen", "category": "invitations", "priority": "medium", "notes": "4-6 Monate vorher"},
  {"title": "Einladungen versenden", "category": "invitations", "priority": "high", "notes": "3 Monate vorher"},
  {"title": "Blumenschmuck bestellen", "category": "flowers", "priority": "medium", "notes": "3-4 Monate vorher"},
  {"title": "Dekoration planen und bestellen", "category": "decoration", "priority": "medium", "notes": "3-4 Monate vorher"},
  {"title": "Eheringe aussuchen und bestellen", "category": "general", "priority": "high", "notes": "3-4 Monate vorher"},
  {"title": "Hochzeitstorte bestellen", "category": "catering", "priority": "medium", "notes": "2-3 Monate vorher"},
  {"title": "Sitzplan erstellen", "category": "general", "priority": "medium", "notes": "1-2 Monate vorher"},
  {"title": "Trauzeugen auswählen", "category": "general", "priority": "high", "notes": "So früh wie möglich"},
  {"title": "Hochzeitsreise buchen", "category": "other", "priority": "medium", "notes": "6-9 Monate vorher"},
  {"title": "Menükarten erstellen", "category": "catering", "priority": "low", "notes": "1 Monat vorher"},
  {"title": "Gastgeschenke besorgen", "category": "other", "priority": "low", "notes": "1-2 Monate vorher"},
  {"title": "Probe-Hochzeitsfrisur", "category": "dress", "priority": "medium", "notes": "1-2 Monate vorher"},
  {"title": "Finaler Check mit allen Dienstleistern", "category": "general", "priority": "high", "notes": "1 Woche vorher"}
]'::jsonb, true, null),
('Moderne Hochzeit Basics', 'Grundlegende Aufgaben für eine moderne, entspannte Hochzeit', 'basic', 'modern', '[
  {"title": "Location finden", "category": "venue", "priority": "high", "notes": "Kann auch Restaurant oder privater Ort sein"},
  {"title": "Gästeliste erstellen", "category": "general", "priority": "high", "notes": "Bestimmt Budget und Location-Größe"},
  {"title": "Budget festlegen", "category": "general", "priority": "high", "notes": "Realistisch kalkulieren"},
  {"title": "Fotograf organisieren", "category": "photography", "priority": "medium", "notes": "Kann auch befreundeter Fotograf sein"},
  {"title": "Musik planen", "category": "music", "priority": "medium", "notes": "Playlist oder DJ"},
  {"title": "Outfit besorgen", "category": "dress", "priority": "high", "notes": "Muss nicht klassisch sein"},
  {"title": "Einladungen verschicken", "category": "invitations", "priority": "high", "notes": "Digital oder gedruckt"},
  {"title": "Catering organisieren", "category": "catering", "priority": "high", "notes": "Buffet, Food Trucks oder Restaurant"},
  {"title": "Dekoration planen", "category": "decoration", "priority": "medium", "notes": "Weniger ist mehr"},
  {"title": "Trauung planen", "category": "general", "priority": "high", "notes": "Freie Trauung oder Standesamt"}
]'::jsonb, true, null),
('Last-Minute Hochzeit', 'Schnelle Planung für spontane Hochzeiten', 'basic', 'casual', '[
  {"title": "Standesamt Termin vereinbaren", "category": "general", "priority": "high", "notes": "Sofort erledigen"},
  {"title": "Kleine Location buchen", "category": "venue", "priority": "high", "notes": "Restaurant oder private Location"},
  {"title": "Trauzeugen kontaktieren", "category": "general", "priority": "high", "notes": "Pflicht für Standesamt"},
  {"title": "Outfit kaufen", "category": "dress", "priority": "high", "notes": "Von der Stange ist völlig ok"},
  {"title": "Ringe besorgen", "category": "general", "priority": "high", "notes": "Einfache Modelle gibt es sofort"},
  {"title": "Gäste telefonisch einladen", "category": "invitations", "priority": "high", "notes": "Keine Zeit für gedruckte Einladungen"},
  {"title": "Fotograf fragen", "category": "photography", "priority": "medium", "notes": "Freund mit guter Kamera"},
  {"title": "Kleines Catering organisieren", "category": "catering", "priority": "medium", "notes": "Restaurant-Menü oder Buffet"},
  {"title": "Blumenstrauß bestellen", "category": "flowers", "priority": "low", "notes": "Beim lokalen Floristen"},
  {"title": "Feiern!", "category": "other", "priority": "high", "notes": "Das Wichtigste nicht vergessen"}
]'::jsonb, true, null);