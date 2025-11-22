/*
  # Fix invitation_status Constraint
  
  Das Problem: Der invitation_status Constraint in der DB hat falsche Werte 
  ('planned', 'invited', 'responded') aber sollte 
  ('not_sent', 'save_the_date_sent', 'invitation_sent', 'reminder_sent') haben.
  
  Diese Migration:
  1. Droppt den falschen Constraint
  2. Erstellt den korrekten Constraint
  3. Updated existierende Daten auf gültige Werte
*/

-- Update existierende Daten mit ungültigen Werten
UPDATE guests 
SET invitation_status = 'not_sent' 
WHERE invitation_status NOT IN ('not_sent', 'save_the_date_sent', 'invitation_sent', 'reminder_sent')
   OR invitation_status IS NULL;

-- Drop falschen Constraint
ALTER TABLE guests 
DROP CONSTRAINT IF EXISTS guests_invitation_status_check;

-- Erstelle korrekten Constraint
ALTER TABLE guests 
ADD CONSTRAINT guests_invitation_status_check 
CHECK (invitation_status IN ('not_sent', 'save_the_date_sent', 'invitation_sent', 'reminder_sent'));

-- Stelle sicher, dass Default korrekt ist
ALTER TABLE guests 
ALTER COLUMN invitation_status SET DEFAULT 'not_sent';
