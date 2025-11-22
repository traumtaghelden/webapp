/*
  # Add order_index to tasks table for Kanban card positioning

  1. Changes
    - Add `order_index` column to `tasks` table (integer, not null, default 0)
    - Create index on (wedding_id, status, order_index) for optimal query performance
  
  2. Notes
    - Tasks will be sorted by order_index within each status column
    - Lower order_index values appear first
    - Default value 0 is suitable for new tasks added at end of column
*/

-- Add order_index column to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE tasks ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create composite index for efficient querying of tasks by status and order
CREATE INDEX IF NOT EXISTS idx_tasks_wedding_status_order 
ON tasks(wedding_id, status, order_index);

-- Add index on order_index for reordering operations
CREATE INDEX IF NOT EXISTS idx_tasks_order_index 
ON tasks(order_index);