/*
  # Add phone and character_id to wedding_team_roles

  1. Changes
    - Add `phone` column (text, nullable) - Optional phone number for team members
    - Add `character_id` column (text, nullable) - Stores the selected avatar/character ID
    - Add `avatar_url` column (text, nullable) - Stores the avatar image URL for reference

  2. Important Notes
    - All new columns are nullable to maintain backward compatibility
    - Existing rows will have NULL values for these fields
    - No data migration needed as this is additive
*/

-- Add phone column to wedding_team_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_team_roles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE wedding_team_roles ADD COLUMN phone text;
  END IF;
END $$;

-- Add character_id column to wedding_team_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_team_roles' AND column_name = 'character_id'
  ) THEN
    ALTER TABLE wedding_team_roles ADD COLUMN character_id text;
  END IF;
END $$;

-- Add avatar_url column to wedding_team_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_team_roles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE wedding_team_roles ADD COLUMN avatar_url text;
  END IF;
END $$;
