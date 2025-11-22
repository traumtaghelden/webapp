/*
  # Create Admin System

  1. New Enums
    - `user_role_type` - User roles (user, admin)

  2. Schema Changes
    - Add `user_role` column to `user_profiles` table
    - Add index on `user_role` for performance

  3. New Tables
    - `admin_audit_log` - Tracks all admin actions
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key to user_profiles)
      - `action_type` (text) - Type of action performed
      - `target_user_id` (uuid, foreign key to user_profiles, nullable)
      - `details` (jsonb) - Additional action details
      - `created_at` (timestamp)

    - `admin_support_notes` - Admin notes for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `admin_id` (uuid, foreign key to user_profiles)
      - `note` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  4. Security
    - Enable RLS on all new tables
    - Only admins can access admin tables
    - Audit logs are immutable
*/

-- Create user role enum
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add user_role column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'user_role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN user_role user_role_type DEFAULT 'user' NOT NULL;
  END IF;
END $$;

-- Create index on user_role for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON user_profiles(user_role);

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user_id ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- Create admin_support_notes table
CREATE TABLE IF NOT EXISTS admin_support_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_support_notes_user_id ON admin_support_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_support_notes_created_at ON admin_support_notes(created_at DESC);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_support_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_audit_log
-- Only admins can read audit logs
CREATE POLICY "Admins can read all audit logs"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role = 'admin'
    )
  );

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role = 'admin'
    )
  );

-- RLS Policies for admin_support_notes
-- Only admins can read support notes
CREATE POLICY "Admins can read all support notes"
  ON admin_support_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role = 'admin'
    )
  );

-- Only admins can insert support notes
CREATE POLICY "Admins can insert support notes"
  ON admin_support_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role = 'admin'
    )
    AND admin_id = auth.uid()
  );

-- Only admins can update their own support notes
CREATE POLICY "Admins can update own support notes"
  ON admin_support_notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role = 'admin'
    )
    AND admin_id = auth.uid()
  )
  WITH CHECK (
    admin_id = auth.uid()
  );

-- Only admins can delete their own support notes
CREATE POLICY "Admins can delete own support notes"
  ON admin_support_notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role = 'admin'
    )
    AND admin_id = auth.uid()
  );

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_admin_support_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_admin_support_notes_updated_at_trigger ON admin_support_notes;
CREATE TRIGGER update_admin_support_notes_updated_at_trigger
  BEFORE UPDATE ON admin_support_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_support_notes_updated_at();