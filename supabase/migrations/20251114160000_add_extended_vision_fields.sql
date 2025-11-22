/*
  # Erweiterte Vision-Felder für 3-Schritte Vision Modal

  ## Zusammenfassung
  Erweitert die weddings-Tabelle um strukturierte Felder für den neuen 3-Schritte Vision-Modal.
  Diese Felder ermöglichen detaillierte Speicherung von Hochzeitsvision, Prioritäten und Präferenzen.

  ## Änderungen
  1. Neue Spalten:
    - `vision_details` (jsonb): Speichert Größe, Atmosphäre, Budget-Rahmen, Saison, Location-Typ, geschätzte Gästezahl
      Struktur: {
        "size": "intim|mittel|gross",
        "atmosphere_formal": 1-5 (1=locker, 5=formell),
        "atmosphere_traditional": 1-5 (1=modern, 5=traditionell),
        "budget_range": "bis_5k|5_10k|10_20k|20_30k|30k_plus|unklar",
        "season_preference": "fruehling|sommer|herbst|winter|flexibel",
        "location_type": "indoor|outdoor|hybrid|unklar",
        "guest_count_min": number,
        "guest_count_max": number
      }

    - `vision_priorities` (jsonb): Bewertungen (1-5 Sterne) für 10 Hochzeitsaspekte
      Struktur: {
        "location": 1-5,
        "food_drinks": 1-5,
        "decoration": 1-5,
        "music_entertainment": 1-5,
        "photography_video": 1-5,
        "atmosphere": 1-5,
        "guest_count": 1-5,
        "timeline": 1-5,
        "budget_control": 1-5,
        "personal_details": 1-5,
        "custom_aspects": string (optional)
      }

    - `vision_preferences` (jsonb): Must-Haves, Deal-Breakers und besondere Wünsche
      Struktur: {
        "must_haves": string,
        "deal_breakers": string,
        "special_wishes": string
      }

    - `vision_step_progress` (jsonb): Tracking welche Schritte ausgefüllt wurden
      Struktur: {
        "step1_complete": boolean,
        "step2_complete": boolean,
        "step3_complete": boolean
      }

  2. Bestehende Felder bleiben erhalten:
    - `vision_text` (text): Freitext-Vision
    - `vision_keywords` (text[]): Array von Stil-Keywords

  ## Hinweise
  - Alle neuen Felder sind optional (nullable) für schrittweises Ausfüllen
  - Bestehende Vision-Daten bleiben unberührt
  - Die Struktur ermöglicht flexible Erweiterungen in der Zukunft
*/

-- Füge erweiterte Vision-Felder zur weddings-Tabelle hinzu
DO $$
BEGIN
  -- vision_details für strukturierte Hochzeitsdetails
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'vision_details'
  ) THEN
    ALTER TABLE weddings ADD COLUMN vision_details jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- vision_priorities für Bewertungen der Wichtigkeit verschiedener Aspekte
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'vision_priorities'
  ) THEN
    ALTER TABLE weddings ADD COLUMN vision_priorities jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- vision_preferences für Must-Haves und Deal-Breakers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'vision_preferences'
  ) THEN
    ALTER TABLE weddings ADD COLUMN vision_preferences jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- vision_step_progress für Fortschritts-Tracking der 3 Schritte
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'vision_step_progress'
  ) THEN
    ALTER TABLE weddings ADD COLUMN vision_step_progress jsonb DEFAULT '{"step1_complete": false, "step2_complete": false, "step3_complete": false}'::jsonb;
  END IF;
END $$;
