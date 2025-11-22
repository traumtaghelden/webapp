/*
  # Update Location Categories to Usage-Based System

  1. Changes
    - Drop old location category default function
    - Create new usage-based location categories default function
    - Create location_category_assignments junction table for many-to-many relationship
    - Add new indexes for performance

  2. New Categories (Usage-Based)
    - Trauung (Ceremony)
    - Empfang (Reception)
    - Feier (Party/Dinner)
    - Getting Ready (Preparation)
    - Übernachtung (Accommodation)
    - After Party
    - Polterabend (Pre-wedding event)
    - Brunch (Day-after brunch)
    - Fotoshooting (Photo session)
    - Sonstige (Other)

  3. Security
    - Enable RLS on location_category_assignments table
    - Add policies for authenticated users to manage their assignments
*/

-- Drop old function if exists
DROP FUNCTION IF EXISTS create_default_location_categories(uuid);

-- Create junction table for location-category assignments (many-to-many)
CREATE TABLE IF NOT EXISTS location_category_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES location_categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, category_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_category_assignments_wedding 
  ON location_category_assignments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_location_category_assignments_location 
  ON location_category_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_category_assignments_category 
  ON location_category_assignments(category_id);

-- Enable RLS
ALTER TABLE location_category_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_category_assignments
CREATE POLICY "Users can view their location category assignments"
  ON location_category_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = location_category_assignments.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their location category assignments"
  ON location_category_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = location_category_assignments.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their location category assignments"
  ON location_category_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = location_category_assignments.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

-- Create new function for usage-based default categories
CREATE OR REPLACE FUNCTION create_default_location_categories(p_wedding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new usage-based categories
  INSERT INTO location_categories (wedding_id, name, icon, color, display_order)
  VALUES
    (p_wedding_id, 'Trauung', 'Church', '#d4af37', 1),
    (p_wedding_id, 'Empfang', 'Champagne', '#c19a2e', 2),
    (p_wedding_id, 'Feier', 'PartyPopper', '#b8860b', 3),
    (p_wedding_id, 'Getting Ready', 'Sparkles', '#daa520', 4),
    (p_wedding_id, 'Übernachtung', 'Hotel', '#d4af37', 5),
    (p_wedding_id, 'After Party', 'Music', '#c19a2e', 6),
    (p_wedding_id, 'Polterabend', 'Users', '#b8860b', 7),
    (p_wedding_id, 'Brunch', 'Coffee', '#daa520', 8),
    (p_wedding_id, 'Fotoshooting', 'Camera', '#d4af37', 9),
    (p_wedding_id, 'Sonstige', 'MapPin', '#999999', 10)
  ON CONFLICT (wedding_id, name) DO NOTHING;
END;
$$;