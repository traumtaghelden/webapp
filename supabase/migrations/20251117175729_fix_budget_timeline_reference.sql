/*
  # Fix Budget Item Timeline Reference

  ## Changes
  - Update `budget_items.timeline_event_id` to reference `wedding_day_blocks` instead of deprecated `wedding_timeline`
  - Drop old foreign key constraint
  - Add new foreign key constraint pointing to `wedding_day_blocks`

  ## Security
  - No RLS changes needed (existing policies remain valid)
*/

-- Drop the old foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'budget_items_timeline_event_id_fkey'
    AND table_name = 'budget_items'
  ) THEN
    ALTER TABLE budget_items DROP CONSTRAINT budget_items_timeline_event_id_fkey;
  END IF;
END $$;

-- Add new foreign key constraint referencing wedding_day_blocks
ALTER TABLE budget_items 
  ADD CONSTRAINT budget_items_timeline_event_id_fkey 
  FOREIGN KEY (timeline_event_id) 
  REFERENCES wedding_day_blocks(id) 
  ON DELETE SET NULL;