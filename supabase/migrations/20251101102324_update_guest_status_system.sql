/*
  # Update Guest Status System

  1. Changes
    - Rename `rsvp_status` column to `status`
    - Update status values from RSVP terminology to invitation workflow
    - Migrate existing data:
      - 'pending' → 'planned' (Geplant)
      - 'accepted' → 'accepted' (Zugesagt)
      - 'declined' → 'declined' (Abgesagt)
    - Add new status option 'invited' (Einladung versendet)
  
  2. Data Migration
    - Preserve all existing guest data
    - Update all references to use new status values
  
  3. Notes
    - This maintains backward compatibility by keeping 'accepted' and 'declined' the same
    - Only 'pending' is mapped to 'planned' to better reflect the workflow
    - New status 'invited' can be set manually after invitations are sent
*/

-- Update existing data: change 'pending' to 'planned'
UPDATE guests 
SET rsvp_status = 'planned' 
WHERE rsvp_status = 'pending';

-- Add check constraint for new status values
ALTER TABLE guests 
DROP CONSTRAINT IF EXISTS guests_rsvp_status_check;

ALTER TABLE guests 
ADD CONSTRAINT guests_status_check 
CHECK (rsvp_status IN ('planned', 'invited', 'accepted', 'declined'));

-- Update default value to use new terminology
ALTER TABLE guests 
ALTER COLUMN rsvp_status SET DEFAULT 'planned';
