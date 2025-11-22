/*
  # Drop wedding_timeline foreign key constraints

  ## Overview
  Remove all foreign key constraints referencing wedding_timeline
  before dropping the table.

  ## Changes
  - Drop foreign key constraints from tasks, vendors, budget_items
  - Drop foreign key constraints from junction tables
  - These will be recreated pointing to wedding_day_blocks in next migration

  ## Security
  - No RLS changes needed
*/

-- Drop tasks.timeline_event_id constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_timeline_event_id_fkey'
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_timeline_event_id_fkey;
  END IF;
END $$;

-- Drop vendors.timeline_event_id constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_timeline_event_id_fkey'
    AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors DROP CONSTRAINT vendors_timeline_event_id_fkey;
  END IF;
END $$;

-- Drop location_event_assignments.event_id constraint (old one)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'location_event_assignments_event_id_fkey'
    AND table_name = 'location_event_assignments'
  ) THEN
    ALTER TABLE location_event_assignments DROP CONSTRAINT location_event_assignments_event_id_fkey;
  END IF;
END $$;

-- Drop vendor_event_assignments.timeline_event_id constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendor_event_assignments_timeline_event_id_fkey'
    AND table_name = 'vendor_event_assignments'
  ) THEN
    ALTER TABLE vendor_event_assignments DROP CONSTRAINT vendor_event_assignments_timeline_event_id_fkey;
  END IF;
END $$;