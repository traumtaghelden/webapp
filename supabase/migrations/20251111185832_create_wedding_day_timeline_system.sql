/*
  # Create Wedding Day Timeline System

  ## Overview
  Creates a comprehensive system for planning the wedding day with event blocks,
  minute-by-minute timelines, vendors, packing lists, and checklists.

  ## New Tables

  ### 1. wedding_day_blocks
  Main event blocks for the wedding day (e.g., "Church", "Cocktail Reception")
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key to weddings)
  - `title` (text) - Block title
  - `description` (text) - Optional description
  - `event_type` (text) - Type for color/icon assignment
  - `start_time` (time) - Start time (24h format)
  - `end_time` (time) - End time (24h format)
  - `duration_minutes` (integer) - Calculated duration
  - `location_name` (text) - Location name
  - `location_address` (text) - Optional address
  - `color` (text) - Hex color based on event type
  - `icon` (text) - Lucide React icon name
  - `sort_order` (integer) - Display order
  - `is_expanded` (boolean) - UI state for expand/collapse
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. wedding_day_timeline_items
  Minute-by-minute events within each block
  - `id` (uuid, primary key)
  - `block_id` (uuid, foreign key to wedding_day_blocks)
  - `title` (text) - Event title
  - `start_time` (time) - Start time
  - `duration_minutes` (integer) - Duration
  - `assigned_person` (text) - Responsible person
  - `notes` (text) - Additional notes
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. wedding_day_vendors
  Vendors/service providers assigned to blocks
  - `id` (uuid, primary key)
  - `block_id` (uuid, foreign key to wedding_day_blocks)
  - `vendor_id` (uuid, optional foreign key to vendors)
  - `vendor_name` (text) - Name
  - `role` (text) - Role (e.g., "Photographer", "Musician")
  - `arrival_time` (time) - Expected arrival
  - `departure_time` (time) - Expected departure
  - `contact_phone` (text) - Contact number
  - `is_confirmed` (boolean) - Confirmation status
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. wedding_day_packing_list
  Items to pack for each event block
  - `id` (uuid, primary key)
  - `block_id` (uuid, foreign key to wedding_day_blocks)
  - `item_name` (text) - Item name
  - `quantity` (integer) - Number of items
  - `category` (text) - Category (Ceremony, Deco, Emergency, Other)
  - `is_packed` (boolean) - Packing status
  - `assigned_to` (text) - Person responsible for packing
  - `notes` (text) - Additional notes
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. wedding_day_checklist
  Pre-event checklist items for each block
  - `id` (uuid, primary key)
  - `block_id` (uuid, foreign key to wedding_day_blocks)
  - `task_title` (text) - Task title
  - `description` (text) - Task description
  - `is_completed` (boolean) - Completion status
  - `completed_at` (timestamptz) - When completed
  - `completed_by` (text) - Who completed it
  - `due_before_minutes` (integer) - Minutes before block start
  - `priority` (text) - high, medium, low
  - `assigned_to` (text) - Person responsible
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access data for their own weddings
  - Policies for SELECT, INSERT, UPDATE, DELETE

  ## Indexes
  - Foreign key indexes for performance
  - Sort order indexes for ordering queries
*/

-- Create wedding_day_blocks table
CREATE TABLE IF NOT EXISTS wedding_day_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'other',
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,
  location_name text,
  location_address text,
  color text NOT NULL DEFAULT '#FCD34D',
  icon text NOT NULL DEFAULT 'Calendar',
  sort_order integer NOT NULL DEFAULT 0,
  is_expanded boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wedding_day_timeline_items table
CREATE TABLE IF NOT EXISTS wedding_day_timeline_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES wedding_day_blocks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 15,
  assigned_person text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wedding_day_vendors table
CREATE TABLE IF NOT EXISTS wedding_day_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES wedding_day_blocks(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_name text NOT NULL,
  role text NOT NULL,
  arrival_time time NOT NULL,
  departure_time time,
  contact_phone text,
  is_confirmed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wedding_day_packing_list table
CREATE TABLE IF NOT EXISTS wedding_day_packing_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES wedding_day_blocks(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  category text NOT NULL DEFAULT 'other',
  is_packed boolean DEFAULT false,
  assigned_to text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wedding_day_checklist table
CREATE TABLE IF NOT EXISTS wedding_day_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES wedding_day_blocks(id) ON DELETE CASCADE NOT NULL,
  task_title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by text,
  due_before_minutes integer DEFAULT 0,
  priority text NOT NULL DEFAULT 'medium',
  assigned_to text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT priority_check CHECK (priority IN ('high', 'medium', 'low'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wedding_day_blocks_wedding_id ON wedding_day_blocks(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_blocks_sort_order ON wedding_day_blocks(sort_order);
CREATE INDEX IF NOT EXISTS idx_wedding_day_timeline_items_block_id ON wedding_day_timeline_items(block_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_timeline_items_sort_order ON wedding_day_timeline_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_wedding_day_vendors_block_id ON wedding_day_vendors(block_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_packing_list_block_id ON wedding_day_packing_list(block_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_packing_list_sort_order ON wedding_day_packing_list(sort_order);
CREATE INDEX IF NOT EXISTS idx_wedding_day_checklist_block_id ON wedding_day_checklist(block_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_checklist_sort_order ON wedding_day_checklist(sort_order);

-- Enable Row Level Security
ALTER TABLE wedding_day_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_day_timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_day_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_day_packing_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_day_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wedding_day_blocks
CREATE POLICY "Users can view blocks for their weddings"
  ON wedding_day_blocks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert blocks for their weddings"
  ON wedding_day_blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update blocks for their weddings"
  ON wedding_day_blocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete blocks for their weddings"
  ON wedding_day_blocks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_day_blocks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies for wedding_day_timeline_items
CREATE POLICY "Users can view timeline items for their weddings"
  ON wedding_day_timeline_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_timeline_items.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timeline items for their weddings"
  ON wedding_day_timeline_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_timeline_items.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline items for their weddings"
  ON wedding_day_timeline_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_timeline_items.block_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_timeline_items.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline items for their weddings"
  ON wedding_day_timeline_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_timeline_items.block_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies for wedding_day_vendors
CREATE POLICY "Users can view vendors for their weddings"
  ON wedding_day_vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vendors for their weddings"
  ON wedding_day_vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vendors for their weddings"
  ON wedding_day_vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vendors for their weddings"
  ON wedding_day_vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_vendors.block_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies for wedding_day_packing_list
CREATE POLICY "Users can view packing items for their weddings"
  ON wedding_day_packing_list FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert packing items for their weddings"
  ON wedding_day_packing_list FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update packing items for their weddings"
  ON wedding_day_packing_list FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete packing items for their weddings"
  ON wedding_day_packing_list FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies for wedding_day_checklist
CREATE POLICY "Users can view checklist items for their weddings"
  ON wedding_day_checklist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checklist items for their weddings"
  ON wedding_day_checklist FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklist items for their weddings"
  ON wedding_day_checklist FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checklist items for their weddings"
  ON wedding_day_checklist FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_checklist.block_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wedding_day_blocks_updated_at
  BEFORE UPDATE ON wedding_day_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_day_timeline_items_updated_at
  BEFORE UPDATE ON wedding_day_timeline_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_day_vendors_updated_at
  BEFORE UPDATE ON wedding_day_vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_day_packing_list_updated_at
  BEFORE UPDATE ON wedding_day_packing_list
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_day_checklist_updated_at
  BEFORE UPDATE ON wedding_day_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
