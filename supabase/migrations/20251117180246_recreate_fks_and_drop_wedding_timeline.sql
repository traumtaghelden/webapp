/*
  # Recreate foreign keys pointing to wedding_day_blocks and drop wedding_timeline

  ## Overview
  Now that all references are cleaned, we can:
  1. Recreate foreign keys pointing to wedding_day_blocks
  2. Drop the deprecated wedding_timeline table

  ## Changes
  - Add foreign keys for tasks, vendors pointing to wedding_day_blocks
  - Add foreign keys for junction tables pointing to wedding_day_blocks
  - Drop timeline_event_guest_attendance table
  - Drop wedding_timeline table

  ## Security
  - No RLS changes needed
*/

-- ============================================
-- 1. Add new foreign key constraints
-- ============================================

-- tasks.timeline_event_id -> wedding_day_blocks
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'timeline_event_id'
  ) THEN
    ALTER TABLE tasks 
      ADD CONSTRAINT tasks_timeline_event_id_fkey 
      FOREIGN KEY (timeline_event_id) 
      REFERENCES wedding_day_blocks(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- vendors.timeline_event_id -> wedding_day_blocks
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'timeline_event_id'
  ) THEN
    ALTER TABLE vendors 
      ADD CONSTRAINT vendors_timeline_event_id_fkey 
      FOREIGN KEY (timeline_event_id) 
      REFERENCES wedding_day_blocks(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- location_event_assignments.event_id -> wedding_day_blocks
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'location_event_assignments'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_event_assignments' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE location_event_assignments 
      ADD CONSTRAINT location_event_assignments_event_id_fkey 
      FOREIGN KEY (event_id) 
      REFERENCES wedding_day_blocks(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- vendor_event_assignments.timeline_event_id -> wedding_day_blocks
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'vendor_event_assignments'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_event_assignments' AND column_name = 'timeline_event_id'
  ) THEN
    ALTER TABLE vendor_event_assignments 
      ADD CONSTRAINT vendor_event_assignments_timeline_event_id_fkey 
      FOREIGN KEY (timeline_event_id) 
      REFERENCES wedding_day_blocks(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 2. Drop related tables
-- ============================================

-- Drop timeline_event_guest_attendance (depends on wedding_timeline)
DROP TABLE IF EXISTS timeline_event_guest_attendance CASCADE;

-- ============================================
-- 3. Drop wedding_timeline table
-- ============================================
DROP TABLE IF EXISTS wedding_timeline CASCADE;