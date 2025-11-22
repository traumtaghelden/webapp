/*
  # Aufgaben-Kommentare und Dateianhänge

  1. Neue Tabellen
    - `task_comments`
      - `id` (uuid, primary key) - Eindeutige ID
      - `task_id` (uuid) - Referenz zur Aufgabe
      - `user_id` (uuid) - Benutzer, der kommentiert hat
      - `comment` (text) - Kommentartext
      - `created_at` (timestamptz) - Erstellungszeitpunkt
      - `updated_at` (timestamptz) - Aktualisierungszeitpunkt
    
    - `task_attachments`
      - `id` (uuid, primary key) - Eindeutige ID
      - `task_id` (uuid) - Referenz zur Aufgabe
      - `file_name` (text) - Name der Datei
      - `file_url` (text) - URL zur Datei im Storage
      - `file_size` (bigint) - Dateigröße in Bytes
      - `file_type` (text) - MIME-Type der Datei
      - `uploaded_by` (uuid) - Benutzer, der hochgeladen hat
      - `created_at` (timestamptz) - Upload-Zeitpunkt

  2. Security
    - Enable RLS on both tables
    - Users can view comments/attachments for tasks in their weddings
    - Users can insert comments/attachments for tasks in their weddings
    - Users can delete their own comments/attachments
*/

CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for tasks in their weddings"
  ON task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_comments.task_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert comments for tasks in their weddings"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_comments.task_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for tasks in their weddings"
  ON task_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_attachments.task_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments for tasks in their weddings"
  ON task_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_attachments.task_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own attachments"
  ON task_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_created_at ON task_attachments(created_at DESC);