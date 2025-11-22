/*
  # Create Default Budget Categories Function

  1. Purpose
    - Automatically create 5 sensible default budget categories when a new wedding is created
    - Provides users with a good starting structure for organizing their budget

  2. Default Categories
    - Location (Building2 icon) - For venue rental and location costs
    - Catering (UtensilsCrossed icon) - For food, drinks, and service
    - Dekoration (Sparkles icon) - For flowers, decorations, and room design
    - Foto & Video (Camera icon) - For photographer, videographer, and media
    - Unterhaltung (Music icon) - For DJ, band, music, and entertainment

  3. Implementation
    - Creates a trigger function that runs after a wedding is inserted
    - Automatically inserts the 5 default categories with proper ordering
    - Uses standard icon names compatible with lucide-react
*/

-- Create function to initialize default budget categories
CREATE OR REPLACE FUNCTION create_default_budget_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert 5 default budget categories for the new wedding
  INSERT INTO budget_categories (wedding_id, name, icon, color, order_index)
  VALUES
    (NEW.id, 'Location', 'Building2', '#3B82F6', 0),
    (NEW.id, 'Catering', 'UtensilsCrossed', '#F59E0B', 1),
    (NEW.id, 'Dekoration', 'Sparkles', '#EC4899', 2),
    (NEW.id, 'Foto & Video', 'Camera', '#8B5CF6', 3),
    (NEW.id, 'Unterhaltung', 'Music', '#10B981', 4);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run the function after wedding insertion
DROP TRIGGER IF EXISTS trigger_create_default_budget_categories ON weddings;

CREATE TRIGGER trigger_create_default_budget_categories
  AFTER INSERT ON weddings
  FOR EACH ROW
  EXECUTE FUNCTION create_default_budget_categories();
