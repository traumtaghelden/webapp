/*
  # Create Task Subtasks Table

  1. New Table
    - `task_subtasks`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `title` (text, required)
      - `completed` (boolean, default false)
      - `order_index` (integer, for sorting)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `task_subtasks` table
    - Add policies for authenticated users to manage subtasks for their own tasks

  3. Indexes
    - Index on task_id for faster lookups
    - Index on order_index for sorting
*/

-- Create task_subtasks table
CREATE TABLE IF NOT EXISTS task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_id ON task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_order ON task_subtasks(task_id, order_index);

-- Enable RLS
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view subtasks for their own tasks
CREATE POLICY "Users can view own task subtasks"
ON task_subtasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_subtasks.task_id
      AND w.user_id = auth.uid()
  )
);

-- Policy: Users can insert subtasks for their own tasks
CREATE POLICY "Users can insert own task subtasks"
ON task_subtasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_subtasks.task_id
      AND w.user_id = auth.uid()
  )
);

-- Policy: Users can update subtasks for their own tasks
CREATE POLICY "Users can update own task subtasks"
ON task_subtasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_subtasks.task_id
      AND w.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_subtasks.task_id
      AND w.user_id = auth.uid()
  )
);

-- Policy: Users can delete subtasks for their own tasks
CREATE POLICY "Users can delete own task subtasks"
ON task_subtasks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_subtasks.task_id
      AND w.user_id = auth.uid()
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_task_subtasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_subtasks_updated_at
  BEFORE UPDATE ON task_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_subtasks_updated_at();