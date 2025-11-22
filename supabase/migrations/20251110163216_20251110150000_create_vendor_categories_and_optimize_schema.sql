/*
  # Vendor Categories & Schema Optimization

  ## Beschreibung
  Diese Migration optimiert das Vendor-Schema und fügt Custom-Kategorien hinzu.

  ## 1. Neue Tabellen
    - `vendor_categories` - Custom Vendor Kategorien
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key)
      - `name` (text) - Kategoriename
      - `icon` (text) - Lucide Icon Name
      - `color` (text) - Hex Farbe
      - `is_default` (boolean) - System-Kategorie
      - `order_index` (integer) - Sortierreihenfolge
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 2. Vendor Schema Erweiterungen
    - `contract_sent` (boolean) - Vertrag versendet
    - `deposit_paid` (boolean) - Anzahlung bezahlt
    - `is_favorite` (boolean) - Favorit markiert

  ## 3. Sicherheit
    - RLS aktiviert für vendor_categories
    - Policies für authentifizierte User basierend auf wedding_id
    - Indizes für Performance

  ## 4. Default Kategorien
    - Erstellt Standard-Kategorien für jede Hochzeit
*/

-- ============================================================================
-- VENDOR CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text DEFAULT 'Building2',
  color text DEFAULT '#d4af37',
  is_default boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(wedding_id, name)
);

CREATE INDEX IF NOT EXISTS idx_vendor_categories_wedding_id ON vendor_categories(wedding_id);
CREATE INDEX IF NOT EXISTS idx_vendor_categories_order ON vendor_categories(wedding_id, order_index);

ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendor categories for their weddings"
  ON vendor_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vendor categories for their weddings"
  ON vendor_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vendor categories for their weddings"
  ON vendor_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vendor categories for their weddings"
  ON vendor_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
    AND is_default = false
  );

-- ============================================================================
-- ADD MISSING FIELDS TO VENDORS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'contract_sent'
  ) THEN
    ALTER TABLE vendors ADD COLUMN contract_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'deposit_paid'
  ) THEN
    ALTER TABLE vendors ADD COLUMN deposit_paid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE vendors ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- CREATE DEFAULT CATEGORIES FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_vendor_categories(p_wedding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO vendor_categories (wedding_id, name, icon, color, is_default, order_index)
  VALUES
    (p_wedding_id, 'Location', 'MapPin', '#3b82f6', true, 1),
    (p_wedding_id, 'Catering', 'Utensils', '#10b981', true, 2),
    (p_wedding_id, 'Fotografie', 'Camera', '#8b5cf6', true, 3),
    (p_wedding_id, 'Videografie', 'Video', '#ec4899', true, 4),
    (p_wedding_id, 'Musik', 'Music', '#f59e0b', true, 5),
    (p_wedding_id, 'Floristik', 'Flower2', '#14b8a6', true, 6),
    (p_wedding_id, 'Dekoration', 'Sparkles', '#a855f7', true, 7),
    (p_wedding_id, 'Transport', 'Car', '#06b6d4', true, 8),
    (p_wedding_id, 'Hochzeitstorte', 'Cake', '#f97316', true, 9),
    (p_wedding_id, 'Sonstiges', 'MoreHorizontal', '#6b7280', true, 10)
  ON CONFLICT (wedding_id, name) DO NOTHING;
END;
$$;

-- Create default categories for existing weddings
DO $$
DECLARE
  wedding_record RECORD;
BEGIN
  FOR wedding_record IN SELECT id FROM weddings
  LOOP
    PERFORM create_default_vendor_categories(wedding_record.id);
  END LOOP;
END $$;

-- ============================================================================
-- TRIGGER TO CREATE DEFAULT CATEGORIES FOR NEW WEDDINGS
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_create_default_vendor_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_vendor_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_default_vendor_categories_on_wedding_insert ON weddings;
CREATE TRIGGER create_default_vendor_categories_on_wedding_insert
  AFTER INSERT ON weddings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_vendor_categories();

-- ============================================================================
-- UPDATE TRIGGER FOR VENDOR_CATEGORIES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vendor_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vendor_categories_updated_at ON vendor_categories;
CREATE TRIGGER set_vendor_categories_updated_at
  BEFORE UPDATE ON vendor_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_categories_updated_at();
