/*
  # Create Missing Core Tables
  
  1. New Tables
    - `guests` - Guest management table
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `invitation_status` (text)
      - `rsvp_status` (text)
      - `plus_one_allowed` (boolean)
      - `dietary_restrictions` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `tasks` - Task management table
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `priority` (text)
      - `due_date` (date)
      - `assigned_to` (text)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `wedding_timeline` - Timeline events table
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `time` (time)
      - `date` (date)
      - `event_type` (text)
      - `location` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their wedding data
*/

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  invitation_status text DEFAULT 'pending',
  rsvp_status text DEFAULT 'pending',
  plus_one_allowed boolean DEFAULT false,
  dietary_restrictions text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view guests for their weddings"
  ON guests FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert guests for their weddings"
  ON guests FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update guests for their weddings"
  ON guests FOR UPDATE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete guests for their weddings"
  ON guests FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  due_date date,
  assigned_to text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their weddings"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks for their weddings"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks for their weddings"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks for their weddings"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Create wedding_timeline table
CREATE TABLE IF NOT EXISTS wedding_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  time time,
  date date,
  event_type text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wedding_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeline events for their weddings"
  ON wedding_timeline FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timeline events for their weddings"
  ON wedding_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline events for their weddings"
  ON wedding_timeline FOR UPDATE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline events for their weddings"
  ON wedding_timeline FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_tasks_wedding_id ON tasks(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_timeline_wedding_id ON wedding_timeline(wedding_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_guests_invitation_status ON guests(invitation_status);