/*
  # Add vendor_id to tasks table

  1. Changes
    - Add vendor_id column to tasks table (nullable, foreign key to vendors)
    - Add index on vendor_id for performance
    - Update RLS policies to maintain security

  2. Purpose
    - Link tasks to specific vendors for better organization
    - Enable vendor-specific task filtering and display
*/

-- Add vendor_id column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for vendor_id
CREATE INDEX IF NOT EXISTS idx_tasks_vendor_id ON tasks(vendor_id);

-- The existing RLS policies on tasks table will automatically apply
-- since they check wedding_id ownership, and vendor_id is just an additional optional link
