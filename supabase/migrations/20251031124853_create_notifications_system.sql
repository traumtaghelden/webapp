/*
  # Benachrichtigungssystem erstellen

  1. Neue Tabellen
    - `notifications`
      - `id` (uuid, primary key) - Eindeutige ID
      - `wedding_id` (uuid) - Referenz zur Hochzeit
      - `user_id` (uuid) - Referenz zum Benutzer
      - `type` (text) - Art der Benachrichtigung (task_reminder, budget_alert, rsvp_reminder, etc.)
      - `title` (text) - Titel der Benachrichtigung
      - `message` (text) - Nachrichtentext
      - `link` (text, nullable) - Link zu relevantem Bereich
      - `read` (boolean) - Gelesen-Status
      - `created_at` (timestamptz) - Erstellungszeitpunkt

  2. Security
    - Enable RLS on `notifications` table
    - Users can view notifications for their weddings
    - Users can update read status of their notifications
    - System can insert notifications
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their weddings"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notification read status"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_wedding_id ON notifications(wedding_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);