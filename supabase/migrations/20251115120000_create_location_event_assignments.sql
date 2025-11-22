/*
  # Create Location Event Assignments Table

  ## Overview
  This migration creates a table to manage assignments between locations and timeline events,
  allowing locations to be associated with multiple wedding events.

  ## New Tables

  ### `location_event_assignments`
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key to weddings)
  - `location_id` (uuid, foreign key to locations)
  - `event_id` (uuid, foreign key to wedding_timeline)
  - `notes` (text, nullable) - Additional notes for this assignment
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on `location_event_assignments` table
  - Add policies for authenticated users to manage assignments for their wedding

  ## Indexes
  - Index on wedding_id for performance
  - Index on location_id for lookups
  - Index on event_id for lookups
*/

-- Create location_event_assignments table
CREATE TABLE IF NOT EXISTS location_event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES wedding_timeline(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_event_assignments_wedding_id
  ON location_event_assignments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_location_event_assignments_location_id
  ON location_event_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_event_assignments_event_id
  ON location_event_assignments(event_id);

-- Unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_event_assignments_unique
  ON location_event_assignments(location_id, event_id);

-- Enable RLS
ALTER TABLE location_event_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_event_assignments

-- SELECT: Users can view assignments for their wedding
CREATE POLICY "Users can view their wedding location event assignments"
  ON location_event_assignments
  FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create assignments for their wedding
CREATE POLICY "Users can create location event assignments for their wedding"
  ON location_event_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update assignments for their wedding
CREATE POLICY "Users can update their wedding location event assignments"
  ON location_event_assignments
  FOR UPDATE
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

-- DELETE: Users can delete assignments for their wedding
CREATE POLICY "Users can delete their wedding location event assignments"
  ON location_event_assignments
  FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_location_event_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_location_event_assignments_updated_at
  BEFORE UPDATE ON location_event_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_location_event_assignments_updated_at();
