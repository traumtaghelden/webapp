/*
  # Fix Timeline Block Subtasks - Cleanup and RLS

  1. Cleanup
    - Delete orphaned subtasks that reference non-existent blocks
    - Rename column from timeline_event_id to block_id
  
  2. Security
    - Enable RLS on `timeline_block_subtasks`
    - Add policies for authenticated users
*/

-- First, check if we need to rename and clean up
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'timeline_block_subtasks' 
      AND column_name = 'timeline_event_id'
  ) THEN
    -- Delete orphaned subtasks (those referencing non-existent blocks)
    DELETE FROM timeline_block_subtasks
    WHERE timeline_event_id NOT IN (SELECT id FROM wedding_day_blocks);
    
    -- Rename the column
    ALTER TABLE timeline_block_subtasks 
    RENAME COLUMN timeline_event_id TO block_id;
    
    -- Drop old foreign key if exists
    ALTER TABLE timeline_block_subtasks 
    DROP CONSTRAINT IF EXISTS timeline_block_subtasks_timeline_event_id_fkey;
    
    -- Add new foreign key to wedding_day_blocks
    ALTER TABLE timeline_block_subtasks 
    ADD CONSTRAINT timeline_block_subtasks_block_id_fkey 
    FOREIGN KEY (block_id) REFERENCES wedding_day_blocks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE timeline_block_subtasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view subtasks of their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can create subtasks for their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can update subtasks of their blocks" ON timeline_block_subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks of their blocks" ON timeline_block_subtasks;

-- Create new policies
CREATE POLICY "Users can view subtasks of their blocks"
  ON timeline_block_subtasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks wdb
      JOIN weddings w ON w.id = wdb.wedding_id
      WHERE wdb.id = timeline_block_subtasks.block_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create subtasks for their blocks"
  ON timeline_block_subtasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks wdb
      JOIN weddings w ON w.id = wdb.wedding_id
      WHERE wdb.id = timeline_block_subtasks.block_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtasks of their blocks"
  ON timeline_block_subtasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks wdb
      JOIN weddings w ON w.id = wdb.wedding_id
      WHERE wdb.id = timeline_block_subtasks.block_id
        AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks wdb
      JOIN weddings w ON w.id = wdb.wedding_id
      WHERE wdb.id = timeline_block_subtasks.block_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks of their blocks"
  ON timeline_block_subtasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks wdb
      JOIN weddings w ON w.id = wdb.wedding_id
      WHERE wdb.id = timeline_block_subtasks.block_id
        AND w.user_id = auth.uid()
    )
  );
