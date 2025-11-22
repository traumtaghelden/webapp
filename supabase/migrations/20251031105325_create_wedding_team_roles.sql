/*
  # Create wedding_team_roles table

  1. New Tables
    - `wedding_team_roles`
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key to weddings)
      - `name` (text) - Name of the team member
      - `role` (text) - Role type: 'trauzeuge', 'eltern', or 'helfer'
      - `partner_assignment` (text) - Which partner: 'partner_1' or 'partner_2'
      - `email` (text, nullable) - Optional email for future use
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `wedding_team_roles` table
    - Add policy for authenticated users to read their own team roles
    - Add policy for authenticated users to insert their own team roles
    - Add policy for authenticated users to update their own team roles
    - Add policy for authenticated users to delete their own team roles

  3. Important Notes
    - Foreign key constraint with CASCADE delete when wedding is deleted
    - All fields except email are required
    - Role is restricted to three values via CHECK constraint
    - Partner assignment is restricted to two values via CHECK constraint
*/

-- Create wedding_team_roles table
CREATE TABLE IF NOT EXISTS wedding_team_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('trauzeuge', 'eltern', 'helfer')),
  partner_assignment text NOT NULL CHECK (partner_assignment IN ('partner_1', 'partner_2')),
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wedding_team_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own wedding team roles
CREATE POLICY "Users can read own wedding team roles"
  ON wedding_team_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own wedding team roles
CREATE POLICY "Users can insert own wedding team roles"
  ON wedding_team_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own wedding team roles
CREATE POLICY "Users can update own wedding team roles"
  ON wedding_team_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own wedding team roles
CREATE POLICY "Users can delete own wedding team roles"
  ON wedding_team_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );