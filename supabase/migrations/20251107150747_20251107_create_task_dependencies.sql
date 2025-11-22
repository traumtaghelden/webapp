/*
  # Create Task Dependencies Table

  1. New Table
    - `task_dependencies`
      - `id` (uuid, primary key)
      - `task_id` (uuid, the dependent task)
      - `depends_on_task_id` (uuid, the task that must be completed first)
      - `dependency_type` (text, type of dependency: 'blocks', 'related', etc.)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `task_dependencies` table
    - Users can only manage dependencies for tasks in their wedding

  3. Constraints
    - Prevent self-dependencies
    - Ensure both tasks belong to same wedding
    - Prevent duplicate dependencies

  4. Indexes
    - Index on task_id for quick lookup
    - Index on depends_on_task_id for reverse lookup
*/

-- Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type text DEFAULT 'blocks',
  created_at timestamptz DEFAULT now(),
  
  -- Prevent self-dependencies
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  
  -- Prevent duplicate dependencies
  CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- Enable RLS
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view dependencies for tasks in their wedding
CREATE POLICY "Users can view task dependencies in their wedding"
ON task_dependencies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_dependencies.task_id
      AND w.user_id = auth.uid()
  )
);

-- Policy: Users can create dependencies for tasks in their wedding
CREATE POLICY "Users can create task dependencies in their wedding"
ON task_dependencies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_dependencies.task_id
      AND w.user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_dependencies.depends_on_task_id
      AND w.user_id = auth.uid()
  )
);

-- Policy: Users can delete dependencies for tasks in their wedding
CREATE POLICY "Users can delete task dependencies in their wedding"
ON task_dependencies FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN weddings w ON w.id = t.wedding_id
    WHERE t.id = task_dependencies.task_id
      AND w.user_id = auth.uid()
  )
);

-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependency()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if adding this dependency would create a circular dependency
  IF EXISTS (
    WITH RECURSIVE dependency_chain AS (
      -- Start with the new dependency
      SELECT depends_on_task_id as task_id, task_id as depends_on
      FROM task_dependencies
      WHERE task_id = NEW.depends_on_task_id
      
      UNION ALL
      
      -- Follow the chain of dependencies
      SELECT td.depends_on_task_id, dc.depends_on
      FROM task_dependencies td
      INNER JOIN dependency_chain dc ON td.task_id = dc.task_id
    )
    SELECT 1 FROM dependency_chain
    WHERE task_id = NEW.task_id
  ) THEN
    RAISE EXCEPTION 'Circular dependency detected';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent circular dependencies
CREATE TRIGGER prevent_circular_dependencies
  BEFORE INSERT ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_dependency();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';