/*
  # Update zu geschlechtsneutraler Partner-Terminologie

  1. Änderungen an der weddings-Tabelle
    - Umbenennung: `bride_name` zu `partner_1_name`
    - Umbenennung: `groom_name` zu `partner_2_name`
    - Neue Spalte: `partner_1_age` (integer, nullable) - Alter von Partner 1
    - Neue Spalte: `partner_2_age` (integer, nullable) - Alter von Partner 2
    - Neue Spalte: `partner_1_hero_type` (text, nullable) - Ausgewählter Heldentyp für Partner 1
    - Neue Spalte: `partner_2_hero_type` (text, nullable) - Ausgewählter Heldentyp für Partner 2

  2. Wichtige Hinweise
    - Bestehende Daten bleiben erhalten durch Umbenennung
    - Neue Felder sind optional (nullable)
    - Altersvalidierung erfolgt auf Anwendungsebene (18-120 Jahre)
*/

-- Spalten umbenennen für geschlechtsneutrale Terminologie
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'bride_name'
  ) THEN
    ALTER TABLE weddings RENAME COLUMN bride_name TO partner_1_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'groom_name'
  ) THEN
    ALTER TABLE weddings RENAME COLUMN groom_name TO partner_2_name;
  END IF;
END $$;

-- Neue optionale Felder hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'partner_1_age'
  ) THEN
    ALTER TABLE weddings ADD COLUMN partner_1_age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'partner_2_age'
  ) THEN
    ALTER TABLE weddings ADD COLUMN partner_2_age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'partner_1_hero_type'
  ) THEN
    ALTER TABLE weddings ADD COLUMN partner_1_hero_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'partner_2_hero_type'
  ) THEN
    ALTER TABLE weddings ADD COLUMN partner_2_hero_type text;
  END IF;
END $$;