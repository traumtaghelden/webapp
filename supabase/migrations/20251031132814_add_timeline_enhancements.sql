/*
  # Timeline-Erweiterungen für Drag-and-Drop und Puffer

  1. Änderungen an Tabelle `wedding_timeline`
    - Neue Spalte `event_type` (text) - Unterscheidet zwischen "event" und "buffer"
    - Neue Spalte `end_time` (time, nullable) - Für manuelle Von-Bis-Eingabe
    - Neue Spalte `buffer_label` (text, nullable) - Bezeichnung für Puffer-Blöcke
  
  2. Wichtige Hinweise
    - event_type hat Standardwert "event" für Abwärtskompatibilität
    - end_time ist optional und wird nur bei Von-Bis-Eingabe verwendet
    - buffer_label wird nur bei event_type="buffer" verwendet
    - duration_minutes bleibt die primäre Quelle für Zeitberechnungen
*/

-- Neue Spalte für Event-Typ hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_timeline' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE wedding_timeline ADD COLUMN event_type text DEFAULT 'event';
  END IF;
END $$;

-- Neue Spalte für End-Zeit hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_timeline' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE wedding_timeline ADD COLUMN end_time time;
  END IF;
END $$;

-- Neue Spalte für Puffer-Bezeichnung hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_timeline' AND column_name = 'buffer_label'
  ) THEN
    ALTER TABLE wedding_timeline ADD COLUMN buffer_label text;
  END IF;
END $$;

-- Constraint für event_type hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wedding_timeline_event_type_check'
  ) THEN
    ALTER TABLE wedding_timeline ADD CONSTRAINT wedding_timeline_event_type_check 
    CHECK (event_type IN ('event', 'buffer'));
  END IF;
END $$;