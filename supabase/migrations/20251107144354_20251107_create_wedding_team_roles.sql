/*
  # Create Wedding Team Roles Table
  
  1. New Tables
    - `wedding_team_roles` - Team members and their roles
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key)
      - `name` (text)
      - `role` (text)
      - `email` (text)
      - `phone` (text)
      - `character` (text) - Avatar character selection
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on table
    - Add policies for authenticated users to manage their wedding team
*/

-- Create wedding_team_roles table
CREATE TABLE IF NOT EXISTS wedding_team_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  email text,
  phone text,
  character text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wedding_team_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team roles for their weddings"
  ON wedding_team_roles FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team roles for their weddings"
  ON wedding_team_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team roles for their weddings"
  ON wedding_team_roles FOR UPDATE
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

CREATE POLICY "Users can delete team roles for their weddings"
  ON wedding_team_roles FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_wedding_team_roles_wedding_id ON wedding_team_roles(wedding_id);