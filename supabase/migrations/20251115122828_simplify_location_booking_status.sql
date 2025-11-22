/*
  # Vereinfachung Location Booking Status

  1. Änderungen
    - Migriert alte Status zu den neuen vereinfachten Status
    - Nur noch zwei Status: 'open' und 'booked'
    - Entfernt veraltete Felder: contract_sent und deposit_paid
  
  2. Migration
    - 'inquiry', 'pending', 'cancelled' -> 'open'
    - 'booked', 'confirmed' -> 'booked'
*/

-- Migriere alte Status zu den neuen vereinfachten Status
UPDATE locations 
SET booking_status = CASE 
  WHEN booking_status IN ('booked', 'confirmed') THEN 'booked'
  ELSE 'open'
END
WHERE booking_status NOT IN ('open', 'booked');

-- Setze Standardwert für booking_status auf 'open'
ALTER TABLE locations 
ALTER COLUMN booking_status SET DEFAULT 'open';

-- Entferne die veralteten Boolean-Felder (optional, nur wenn gewünscht)
-- ALTER TABLE locations DROP COLUMN IF EXISTS contract_sent;
-- ALTER TABLE locations DROP COLUMN IF EXISTS deposit_paid;

-- Kommentar: Die Felder contract_sent und deposit_paid bleiben in der DB,
-- werden aber in der UI nicht mehr verwendet