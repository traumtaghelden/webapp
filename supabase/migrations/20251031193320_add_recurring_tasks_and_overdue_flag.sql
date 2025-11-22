/*
  # Füge wiederkehrende Aufgaben und Überfällig-Flag hinzu

  1. Neue Tabelle
    - `recurring_tasks` - Wiederkehrende Aufgaben
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key zu weddings)
      - `title` (text)
      - `category` (text)
      - `priority` (text)
      - `assigned_to` (text)
      - `notes` (text)
      - `recurrence_pattern` (text) - 'daily', 'weekly', 'monthly'
      - `recurrence_interval` (integer)
      - `start_date` (date)
      - `end_date` (date, nullable)
      - `last_generated` (timestamptz, nullable)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Erweiterte Spalten für tasks Tabelle
    - `recurrence_parent_id` (uuid, nullable)
    - `is_overdue_notified` (boolean)
  
  3. Security
    - Enable RLS auf recurring_tasks
    - Policies für authenticated users
*/

-- Erweitere tasks Tabelle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurrence_parent_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_parent_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'is_overdue_notified'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_overdue_notified boolean DEFAULT false;
  END IF;
END $$;

-- Erstelle recurring_tasks Tabelle
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  category text DEFAULT 'general',
  priority text DEFAULT 'medium',
  assigned_to text DEFAULT '',
  notes text DEFAULT '',
  recurrence_pattern text NOT NULL CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  recurrence_interval integer DEFAULT 1 CHECK (recurrence_interval > 0),
  start_date date NOT NULL,
  end_date date,
  last_generated timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;

-- Policies für recurring_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recurring_tasks' AND policyname = 'Users can view their wedding recurring tasks'
  ) THEN
    CREATE POLICY "Users can view their wedding recurring tasks"
      ON recurring_tasks FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM weddings
          WHERE weddings.id = recurring_tasks.wedding_id
          AND weddings.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recurring_tasks' AND policyname = 'Users can create recurring tasks for their wedding'
  ) THEN
    CREATE POLICY "Users can create recurring tasks for their wedding"
      ON recurring_tasks FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM weddings
          WHERE weddings.id = recurring_tasks.wedding_id
          AND weddings.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recurring_tasks' AND policyname = 'Users can update their wedding recurring tasks'
  ) THEN
    CREATE POLICY "Users can update their wedding recurring tasks"
      ON recurring_tasks FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM weddings
          WHERE weddings.id = recurring_tasks.wedding_id
          AND weddings.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM weddings
          WHERE weddings.id = recurring_tasks.wedding_id
          AND weddings.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recurring_tasks' AND policyname = 'Users can delete their wedding recurring tasks'
  ) THEN
    CREATE POLICY "Users can delete their wedding recurring tasks"
      ON recurring_tasks FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM weddings
          WHERE weddings.id = recurring_tasks.wedding_id
          AND weddings.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_wedding_id ON recurring_tasks(wedding_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_parent ON tasks(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;