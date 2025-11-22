/*
  # Add Missing Guest Table Columns

  ## Summary
  Adds missing columns to the guests table that are required by the FamilyGuestForm component.

  ## Changes Made
  1. New Columns Added to `guests` Table:
    - `table_number` (integer, nullable) - Table assignment for seating plans
    - Note: address, city, postal_code, country columns already exist from previous migration
  
  ## Important Notes
  - Uses IF NOT EXISTS checks to prevent errors if columns already exist
  - All columns are nullable to maintain backward compatibility
  - No data loss occurs with this migration
  
  ## Security
  - No changes to RLS policies - existing policies apply to new columns
  - Users can only access guest data for their own weddings
*/

-- Add table_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'table_number'
  ) THEN
    ALTER TABLE guests ADD COLUMN table_number integer;
  END IF;
END $$;

-- Create index for table_number for better seating plan queries
CREATE INDEX IF NOT EXISTS idx_guests_table_number ON guests(table_number) WHERE table_number IS NOT NULL;