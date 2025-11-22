/*
  # Fix location_event_assignments column naming

  1. Changes
    - Rename `event_id` to `timeline_event_id` in location_event_assignments table
    - This aligns with vendor_event_assignments table naming convention
  
  2. Security
    - No RLS changes needed
*/

-- Rename the column to match vendor_event_assignments naming
ALTER TABLE location_event_assignments 
  RENAME COLUMN event_id TO timeline_event_id;
