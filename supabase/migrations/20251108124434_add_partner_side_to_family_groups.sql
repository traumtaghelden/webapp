/*
  # Add partner_side column to family_groups

  1. Changes
    - Add `partner_side` column to `family_groups` table
    - Default value: 'both'
    - Allowed values: 'partner_1', 'partner_2', 'both'

  2. Notes
    - This column tracks which side of the wedding party the family belongs to
    - Follows the same pattern as guests table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_groups' 
    AND column_name = 'partner_side'
  ) THEN
    ALTER TABLE family_groups 
    ADD COLUMN partner_side text DEFAULT 'both' CHECK (partner_side IN ('partner_1', 'partner_2', 'both'));
  END IF;
END $$;