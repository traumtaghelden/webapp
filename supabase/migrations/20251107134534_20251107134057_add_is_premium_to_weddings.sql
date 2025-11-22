/*
  # Add is_premium column to weddings

  ## Overview
  Adds the is_premium boolean column to the weddings table to support premium feature gating.

  ## Changes
  - Add is_premium column with default false
  - Add index for premium lookups
*/

-- Add is_premium column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE weddings ADD COLUMN is_premium boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for premium lookups
CREATE INDEX IF NOT EXISTS idx_weddings_is_premium ON weddings(is_premium);
