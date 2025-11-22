/*
  # Add Hero Journey Fields to Weddings Table

  ## Summary
  Extends the weddings table with fields to support the Hero Journey / Fundament & Planung system.
  These fields enable tracking of vision, style preferences, and completion status for each planning step.

  ## Changes
  1. New Columns:
    - `vision_text` (text): Stores the couple's vision and goals for their wedding
    - `vision_keywords` (text[]): Array of keywords describing their vision (e.g., "boho", "elegant", "rustic")
    - `style_colors` (jsonb): Color palette with primary, secondary, and accent colors
    - `style_fonts` (jsonb): Font preferences for invitations and design elements
    - `style_theme` (text): Overall theme/style (e.g., "modern", "classic", "bohemian")
    - `fundament_completed` (jsonb): Tracks completion status of each fundament step

  ## Notes
  - All new fields are optional (nullable) to support gradual adoption
  - fundament_completed structure:
    {
      "vision": true/false,
      "budget": true/false,
      "guest_count": true/false,
      "location": true/false,
      "ceremony": true/false,
      "date": true/false,
      "personality": true/false,
      "timeline": true/false,
      "personal_planning": true/false,
      "guest_planning": true/false
    }
  - No new tables required, only extends existing wedding data
*/

-- Add vision and style fields to weddings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'vision_text'
  ) THEN
    ALTER TABLE weddings ADD COLUMN vision_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'vision_keywords'
  ) THEN
    ALTER TABLE weddings ADD COLUMN vision_keywords text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'style_colors'
  ) THEN
    ALTER TABLE weddings ADD COLUMN style_colors jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'style_fonts'
  ) THEN
    ALTER TABLE weddings ADD COLUMN style_fonts jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'style_theme'
  ) THEN
    ALTER TABLE weddings ADD COLUMN style_theme text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'fundament_completed'
  ) THEN
    ALTER TABLE weddings ADD COLUMN fundament_completed jsonb DEFAULT '{
      "vision": false,
      "budget": false,
      "guest_count": false,
      "location": false,
      "ceremony": false,
      "date": false,
      "personality": false,
      "timeline": false,
      "personal_planning": false,
      "guest_planning": false
    }'::jsonb;
  END IF;
END $$;