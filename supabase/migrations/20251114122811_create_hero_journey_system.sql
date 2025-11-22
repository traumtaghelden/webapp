/*
  # Create Hero Journey System

  1. New Tables
    - `hero_journey_progress`
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key to weddings)
      - `phase_id` (text) - identifier for the phase (vision, budget, guests, etc.)
      - `status` (text) - pending, in_progress, completed
      - `progress_percentage` (integer) - 0-100
      - `data` (jsonb) - flexible storage for phase-specific data
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `hero_journey_milestones`
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key to weddings)
      - `milestone_type` (text) - achievement identifier
      - `achieved_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own wedding's journey data
*/

-- Create hero_journey_progress table
CREATE TABLE IF NOT EXISTS hero_journey_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  phase_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  data jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(wedding_id, phase_id)
);

-- Create hero_journey_milestones table
CREATE TABLE IF NOT EXISTS hero_journey_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  milestone_type text NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hero_journey_progress_wedding ON hero_journey_progress(wedding_id);
CREATE INDEX IF NOT EXISTS idx_hero_journey_progress_status ON hero_journey_progress(status);
CREATE INDEX IF NOT EXISTS idx_hero_journey_milestones_wedding ON hero_journey_milestones(wedding_id);

-- Enable RLS
ALTER TABLE hero_journey_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_journey_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hero_journey_progress
CREATE POLICY "Users can view their wedding's journey progress"
  ON hero_journey_progress FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their wedding's journey progress"
  ON hero_journey_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their wedding's journey progress"
  ON hero_journey_progress FOR UPDATE
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

CREATE POLICY "Users can delete their wedding's journey progress"
  ON hero_journey_progress FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for hero_journey_milestones
CREATE POLICY "Users can view their wedding's milestones"
  ON hero_journey_milestones FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their wedding's milestones"
  ON hero_journey_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their wedding's milestones"
  ON hero_journey_milestones FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hero_journey_progress_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_hero_journey_progress_timestamp
  BEFORE UPDATE ON hero_journey_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_journey_progress_updated_at();
