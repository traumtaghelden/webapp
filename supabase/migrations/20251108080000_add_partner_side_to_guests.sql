/*
  # Add Partner Side Assignment to Guests

  ## Summary
  Adds the ability to assign guests to a specific partner's side (bride/groom) or mark them as shared guests.

  ## Changes Made
  1. New Column Added to `guests` Table:
    - `partner_side` (text, nullable) - Indicates which partner the guest belongs to
      - 'partner_1' - Guest from first partner's side
      - 'partner_2' - Guest from second partner's side
      - 'both' - Shared guest (friends of both partners)
      - NULL - Not yet assigned (for backward compatibility)

  ## Important Notes
  - Uses IF NOT EXISTS check to prevent errors if column already exists
  - Column is nullable to maintain backward compatibility with existing guests
  - No data loss occurs with this migration
  - Existing guests will have NULL partner_side until updated

  ## Security
  - No changes to RLS policies - existing policies apply to new column
  - Users can only access guest data for their own weddings

  ## Use Cases
  - Track guest distribution between partners (e.g., "60 from Partner 1, 55 from Partner 2, 10 shared")
  - Filter guests by partner side in reports and statistics
  - Visual organization in guest management interface
  - Better planning for partner-specific events or seating arrangements
*/

-- Add partner_side column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'partner_side'
  ) THEN
    ALTER TABLE guests ADD COLUMN partner_side text CHECK (partner_side IN ('partner_1', 'partner_2', 'both'));
  END IF;
END $$;

-- Create index for partner_side for better filtering and statistics queries
CREATE INDEX IF NOT EXISTS idx_guests_partner_side ON guests(partner_side) WHERE partner_side IS NOT NULL;

-- Add the same column to family_groups table for consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_groups' AND column_name = 'partner_side'
  ) THEN
    ALTER TABLE family_groups ADD COLUMN partner_side text CHECK (partner_side IN ('partner_1', 'partner_2', 'both'));
  END IF;
END $$;

-- Create index for family_groups partner_side
CREATE INDEX IF NOT EXISTS idx_family_groups_partner_side ON family_groups(partner_side) WHERE partner_side IS NOT NULL;
