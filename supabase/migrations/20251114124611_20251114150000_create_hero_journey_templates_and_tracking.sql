/*
  # Create Hero Journey Templates and Enhanced Tracking System

  1. New Tables
    - `hero_journey_step_templates`
      - `id` (uuid, primary key)
      - `step_id` (text) - identifier for the step (vision, budget, guests, etc.)
      - `template_name` (text) - name of the template
      - `template_description` (text) - description
      - `category` (text) - size category (klein, mittel, groß, etc.)
      - `guest_count_min` (integer) - minimum guest count
      - `guest_count_max` (integer) - maximum guest count
      - `budget_min` (numeric) - minimum budget
      - `budget_max` (numeric) - maximum budget
      - `sample_data` (jsonb) - template data to apply
      - `order_index` (integer) - display order
      - `is_active` (boolean) - whether template is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `hero_journey_visits`
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key to weddings)
      - `visited_at` (timestamptz)
      - `progress_snapshot` (jsonb) - snapshot of progress at visit time
      - `created_at` (timestamptz)

  2. Wedding Table Extensions
    - Add fields for ceremony and tracking data

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create hero_journey_step_templates table
CREATE TABLE IF NOT EXISTS hero_journey_step_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id text NOT NULL,
  template_name text NOT NULL,
  template_description text,
  category text NOT NULL DEFAULT 'standard',
  guest_count_min integer,
  guest_count_max integer,
  budget_min numeric(10, 2),
  budget_max numeric(10, 2),
  sample_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hero_journey_visits table
CREATE TABLE IF NOT EXISTS hero_journey_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  visited_at timestamptz DEFAULT now(),
  progress_snapshot jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add ceremony and tracking fields to weddings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weddings' AND column_name = 'ceremony_location') THEN
    ALTER TABLE weddings ADD COLUMN ceremony_location text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weddings' AND column_name = 'ceremony_time') THEN
    ALTER TABLE weddings ADD COLUMN ceremony_time time;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weddings' AND column_name = 'ceremony_duration') THEN
    ALTER TABLE weddings ADD COLUMN ceremony_duration integer DEFAULT 60;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weddings' AND column_name = 'last_heldenplan_visit') THEN
    ALTER TABLE weddings ADD COLUMN last_heldenplan_visit timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weddings' AND column_name = 'current_recommended_step') THEN
    ALTER TABLE weddings ADD COLUMN current_recommended_step text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hero_journey_templates_step ON hero_journey_step_templates(step_id);
CREATE INDEX IF NOT EXISTS idx_hero_journey_templates_active ON hero_journey_step_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_hero_journey_visits_wedding ON hero_journey_visits(wedding_id);
CREATE INDEX IF NOT EXISTS idx_hero_journey_visits_visited_at ON hero_journey_visits(visited_at);

-- Enable RLS
ALTER TABLE hero_journey_step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_journey_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hero_journey_step_templates (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view templates"
  ON hero_journey_step_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for hero_journey_visits
CREATE POLICY "Users can view their wedding's visits"
  ON hero_journey_visits FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their wedding's visits"
  ON hero_journey_visits FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp for templates
CREATE OR REPLACE FUNCTION update_hero_journey_templates_updated_at()
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
CREATE TRIGGER update_hero_journey_templates_timestamp
  BEFORE UPDATE ON hero_journey_step_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_journey_templates_updated_at();
