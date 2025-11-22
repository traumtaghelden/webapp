/*
  # Add Unique Constraint and Default Location Categories

  1. Changes
    - Adds UNIQUE constraint on (wedding_id, name) for location_categories
    - Updates create_default_location_categories function
    - Creates trigger for automatic category creation
    - Creates default categories for all existing weddings

  2. Security
    - Maintains existing RLS policies
*/

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'location_categories_wedding_id_name_key'
  ) THEN
    ALTER TABLE location_categories 
    ADD CONSTRAINT location_categories_wedding_id_name_key 
    UNIQUE (wedding_id, name);
  END IF;
END $$;

-- Update the function to use order_index and ON CONFLICT
CREATE OR REPLACE FUNCTION create_default_location_categories(p_wedding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO location_categories (wedding_id, name, icon, color, is_default, order_index)
  VALUES
    (p_wedding_id, 'Trauung', 'Church', '#d4af37', true, 1),
    (p_wedding_id, 'Empfang', 'Wine', '#c19a2e', true, 2),
    (p_wedding_id, 'Feier', 'PartyPopper', '#b8860b', true, 3),
    (p_wedding_id, 'Getting Ready', 'Sparkles', '#daa520', true, 4),
    (p_wedding_id, 'Übernachtung', 'Hotel', '#d4af37', true, 5),
    (p_wedding_id, 'After Party', 'Music', '#c19a2e', true, 6),
    (p_wedding_id, 'Polterabend', 'Users', '#b8860b', true, 7),
    (p_wedding_id, 'Brunch', 'Coffee', '#daa520', true, 8),
    (p_wedding_id, 'Fotoshooting', 'Camera', '#d4af37', true, 9),
    (p_wedding_id, 'Sonstige', 'MapPin', '#999999', true, 10)
  ON CONFLICT (wedding_id, name) DO NOTHING;
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_create_default_location_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_location_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS create_default_location_categories_on_wedding_insert ON weddings;

-- Create trigger
CREATE TRIGGER create_default_location_categories_on_wedding_insert
  AFTER INSERT ON weddings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_location_categories();

-- Create default categories for all existing weddings
DO $$
DECLARE
  wedding_record RECORD;
BEGIN
  FOR wedding_record IN SELECT id FROM weddings
  LOOP
    PERFORM create_default_location_categories(wedding_record.id);
  END LOOP;
END $$;