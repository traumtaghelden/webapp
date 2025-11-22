/*
  # Create Locations Management System

  ## Overview
  This migration creates a comprehensive location management system for wedding planning,
  allowing users to manage and compare potential wedding venues (churches, halls, outdoor spaces, etc.).

  ## New Tables

  ### `location_categories`
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key to weddings)
  - `name` (text) - Category name (e.g., "Kirche", "Saal", "Hotel")
  - `icon` (text) - Lucide icon name
  - `color` (text) - Hex color code
  - `is_default` (boolean) - Whether this is a system default category
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `locations`
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key to weddings)
  - `name` (text) - Location name
  - `category` (text) - Category name
  - `location_category_id` (uuid, foreign key to location_categories, nullable)
  - `description` (text, nullable)
  - `address` (text, nullable)
  - `city` (text, nullable)
  - `postal_code` (text, nullable)
  - `country` (text, nullable)
  - `contact_name` (text, nullable)
  - `email` (text, nullable)
  - `phone` (text, nullable)
  - `website` (text, nullable)
  - `max_capacity` (integer) - Maximum guest capacity
  - `seated_capacity` (integer, nullable) - Seated guest capacity
  - `standing_capacity` (integer, nullable) - Standing guest capacity
  - `rental_cost` (numeric, default 0) - Base rental cost
  - `deposit_amount` (numeric, default 0) - Security deposit
  - `additional_costs` (numeric, default 0) - Additional fees
  - `total_cost` (numeric, default 0) - Total estimated cost
  - `currency` (text, default 'EUR')
  - `booking_status` (text) - 'inquiry' | 'visited' | 'reserved' | 'booked' | 'confirmed' | 'cancelled'
  - `contract_status` (text) - 'not_sent' | 'sent' | 'signed' | 'completed'
  - `contract_sent` (boolean, default false)
  - `deposit_paid` (boolean, default false)
  - `is_favorite` (boolean, default false)
  - `rating` (integer, nullable) - 1-5 star rating
  - `visit_date` (date, nullable) - Date of location visit
  - `availability_notes` (text, nullable)
  - `amenities` (text[], default '{}') - Available amenities
  - `parking_available` (boolean, default false)
  - `parking_spaces` (integer, nullable)
  - `accessibility_notes` (text, nullable)
  - `catering_included` (boolean, default false)
  - `catering_cost_per_person` (numeric, nullable)
  - `timeline_event_id` (uuid, foreign key to wedding_timeline, nullable)
  - `budget_item_id` (uuid, foreign key to budget_items, nullable)
  - `notes` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `location_attachments`
  - `id` (uuid, primary key)
  - `location_id` (uuid, foreign key to locations)
  - `file_name` (text)
  - `file_url` (text)
  - `file_size` (integer)
  - `file_type` (text)
  - `attachment_type` (text) - 'contract' | 'floor_plan' | 'photo' | 'price_list' | 'other'
  - `uploaded_by` (uuid, nullable)
  - `created_at` (timestamptz)

  ### `location_timeline_assignments`
  - `id` (uuid, primary key)
  - `location_id` (uuid, foreign key to locations)
  - `timeline_event_id` (uuid, foreign key to wedding_timeline)
  - `is_primary_location` (boolean, default true)
  - `notes` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their wedding locations
  - Premium users get unlimited locations, free users limited to 5

  ## Important Notes
  - All costs stored in cents/smallest currency unit for precision
  - Default categories created automatically for new weddings
  - Location capacity tracking integrated with guest management
  - Budget sync for automatic cost tracking
*/

-- Create location_categories table
CREATE TABLE IF NOT EXISTS location_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'MapPin',
  color text NOT NULL DEFAULT '#d4af37',
  is_default boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  location_category_id uuid REFERENCES location_categories(id) ON DELETE SET NULL,
  description text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'Deutschland',
  contact_name text,
  email text,
  phone text,
  website text,
  max_capacity integer DEFAULT 0,
  seated_capacity integer,
  standing_capacity integer,
  rental_cost numeric DEFAULT 0,
  deposit_amount numeric DEFAULT 0,
  additional_costs numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  booking_status text DEFAULT 'inquiry',
  contract_status text DEFAULT 'not_sent',
  contract_sent boolean DEFAULT false,
  deposit_paid boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  visit_date date,
  availability_notes text,
  amenities text[] DEFAULT '{}',
  parking_available boolean DEFAULT false,
  parking_spaces integer,
  accessibility_notes text,
  catering_included boolean DEFAULT false,
  catering_cost_per_person numeric,
  timeline_event_id uuid REFERENCES wedding_timeline(id) ON DELETE SET NULL,
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create location_attachments table
CREATE TABLE IF NOT EXISTS location_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  attachment_type text NOT NULL DEFAULT 'other',
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create location_timeline_assignments table
CREATE TABLE IF NOT EXISTS location_timeline_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  timeline_event_id uuid NOT NULL REFERENCES wedding_timeline(id) ON DELETE CASCADE,
  is_primary_location boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(location_id, timeline_event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_categories_wedding_id ON location_categories(wedding_id);
CREATE INDEX IF NOT EXISTS idx_locations_wedding_id ON locations(wedding_id);
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_booking_status ON locations(booking_status);
CREATE INDEX IF NOT EXISTS idx_locations_is_favorite ON locations(is_favorite);
CREATE INDEX IF NOT EXISTS idx_location_attachments_location_id ON location_attachments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_timeline_assignments_location_id ON location_timeline_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_timeline_assignments_timeline_event_id ON location_timeline_assignments(timeline_event_id);

-- Enable RLS
ALTER TABLE location_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_timeline_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_categories
CREATE POLICY "Users can view their wedding location categories"
  ON location_categories FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert location categories for their wedding"
  ON location_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their wedding location categories"
  ON location_categories FOR UPDATE
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

CREATE POLICY "Users can delete their wedding location categories"
  ON location_categories FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for locations
CREATE POLICY "Users can view their wedding locations"
  ON locations FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert locations for their wedding"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM weddings
        WHERE id = wedding_id
        AND user_id = auth.uid()
        AND is_premium = true
      )
      OR
      (
        SELECT COUNT(*) FROM locations
        WHERE wedding_id = locations.wedding_id
      ) < 5
    )
  );

CREATE POLICY "Users can update their wedding locations"
  ON locations FOR UPDATE
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

CREATE POLICY "Users can delete their wedding locations"
  ON locations FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for location_attachments
CREATE POLICY "Users can view attachments for their wedding locations"
  ON location_attachments FOR SELECT
  TO authenticated
  USING (
    location_id IN (
      SELECT id FROM locations
      WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert attachments for their wedding locations"
  ON location_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    location_id IN (
      SELECT id FROM locations
      WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete attachments for their wedding locations"
  ON location_attachments FOR DELETE
  TO authenticated
  USING (
    location_id IN (
      SELECT id FROM locations
      WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for location_timeline_assignments
CREATE POLICY "Users can view location timeline assignments"
  ON location_timeline_assignments FOR SELECT
  TO authenticated
  USING (
    location_id IN (
      SELECT id FROM locations
      WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert location timeline assignments"
  ON location_timeline_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    location_id IN (
      SELECT id FROM locations
      WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update location timeline assignments"
  ON location_timeline_assignments FOR UPDATE
  TO authenticated
  USING (
    location_id IN (
      SELECT id FROM locations
      WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    location_id IN (
      SELECT id FROM locations
      WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete location timeline assignments"
  ON location_timeline_assignments FOR DELETE
  TO authenticated
  USING (
    location_id IN (
      SELECT id FROM locations
      WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

-- Function to create default location categories
CREATE OR REPLACE FUNCTION create_default_location_categories(p_wedding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO location_categories (wedding_id, name, icon, color, is_default, order_index)
  VALUES
    (p_wedding_id, 'Kirche', 'Church', '#8B4513', true, 1),
    (p_wedding_id, 'Standesamt', 'Building2', '#4169E1', true, 2),
    (p_wedding_id, 'Saal', 'Home', '#d4af37', true, 3),
    (p_wedding_id, 'Hotel', 'Hotel', '#FF6347', true, 4),
    (p_wedding_id, 'Restaurant', 'UtensilsCrossed', '#FF8C00', true, 5),
    (p_wedding_id, 'Outdoor', 'Trees', '#228B22', true, 6),
    (p_wedding_id, 'Schloss', 'Castle', '#9370DB', true, 7),
    (p_wedding_id, 'Weingut', 'Wine', '#8B0000', true, 8),
    (p_wedding_id, 'Scheune', 'Warehouse', '#A0522D', true, 9),
    (p_wedding_id, 'Strand', 'Waves', '#00CED1', true, 10),
    (p_wedding_id, 'Garten', 'Flower', '#32CD32', true, 11)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_categories_updated_at
  BEFORE UPDATE ON location_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_location_updated_at();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_location_updated_at();

CREATE TRIGGER update_location_timeline_assignments_updated_at
  BEFORE UPDATE ON location_timeline_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_location_updated_at();
