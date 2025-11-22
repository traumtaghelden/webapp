/*
  # Add day offset to wedding day blocks

  1. Changes
    - Add `day_offset` column to `wedding_day_blocks` table
      - Type: integer
      - Default: 0 (same day as wedding)
      - Values: 0 = wedding day, 1 = next day (+1)
    
  2. Purpose
    - Allows events to be explicitly marked as next-day events
    - Simpler than automatic time detection
    - User can choose "Hochzeitstag" or "Folgetag (+1)"
*/

-- Add day_offset column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_day_blocks' AND column_name = 'day_offset'
  ) THEN
    ALTER TABLE wedding_day_blocks ADD COLUMN day_offset integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add check constraint to ensure valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'wedding_day_blocks' AND constraint_name = 'wedding_day_blocks_day_offset_check'
  ) THEN
    ALTER TABLE wedding_day_blocks ADD CONSTRAINT wedding_day_blocks_day_offset_check CHECK (day_offset IN (0, 1));
  END IF;
END $$;
