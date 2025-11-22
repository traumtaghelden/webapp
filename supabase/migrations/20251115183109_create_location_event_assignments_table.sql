/*
  # Create location_event_assignments Table

  1. New Table
    - `location_event_assignments`
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key to weddings)
      - `location_id` (uuid, foreign key to locations)
      - `event_id` (uuid, foreign key to wedding_day_blocks)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own assignments
  
  3. Indexes
    - Index on wedding_id for performance
    - Index on location_id for lookups
    - Index on event_id for lookups
*/

-- Create the table
CREATE TABLE IF NOT EXISTS location_event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES wedding_day_blocks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, location_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_event_assignments_wedding_id 
  ON location_event_assignments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_location_event_assignments_location_id 
  ON location_event_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_event_assignments_event_id 
  ON location_event_assignments(event_id);

-- Enable RLS
ALTER TABLE location_event_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view location assignments for their weddings"
  ON location_event_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_event_assignments.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert location assignments for their weddings"
  ON location_event_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_event_assignments.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete location assignments for their weddings"
  ON location_event_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_event_assignments.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );
