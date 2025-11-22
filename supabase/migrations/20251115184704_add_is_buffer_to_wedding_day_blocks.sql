/*
  # Add Buffer Flag to Wedding Day Blocks

  1. Changes
    - Add `is_buffer` boolean column to `wedding_day_blocks` table
    - Default value is `false`
    - Buffer blocks are special time gaps between events that can be marked as intentional buffers
  
  2. Purpose
    - Allow users to mark time gaps between events as intentional buffer time
    - Helps distinguish between planned breaks and unscheduled gaps
*/

-- Add is_buffer column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wedding_day_blocks' 
    AND column_name = 'is_buffer'
  ) THEN
    ALTER TABLE wedding_day_blocks 
    ADD COLUMN is_buffer boolean DEFAULT false NOT NULL;
  END IF;
END $$;