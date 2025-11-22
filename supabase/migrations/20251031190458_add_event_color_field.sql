/*
  # Add color field to wedding timeline events

  1. Changes to `wedding_timeline` table
    - Add `color` column (text) to store the hex color code for each event
    - Default color is set to '#d4af37' (golden) for backward compatibility
  
  2. Notes
    - Existing events will automatically get the default golden color
    - Buffer events can also have custom colors if needed
    - Color format should be hex codes (e.g., '#d4af37', '#3b82f6')
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_timeline' AND column_name = 'color'
  ) THEN
    ALTER TABLE wedding_timeline ADD COLUMN color text DEFAULT '#d4af37';
  END IF;
END $$;