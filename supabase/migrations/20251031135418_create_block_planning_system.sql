/*
  # Block Planning System for Timeline Events

  ## Overview
  This migration creates a comprehensive block planning system that allows detailed planning
  within each timeline event block, including sub-timelines, checklists, items/utensils,
  and integration with tasks and vendors.

  ## New Tables

  ### 1. timeline_block_subtasks
  Stores minute-by-minute sub-events within a timeline block
  - `id` (uuid, primary key)
  - `timeline_event_id` (uuid, foreign key to wedding_timeline)
  - `title` (text) - Sub-event title
  - `start_offset_minutes` (integer) - Minutes after block start
  - `duration_minutes` (integer) - Duration of sub-event
  - `description` (text) - Detailed description
  - `assigned_to` (text) - Person responsible
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. timeline_block_checklist_categories
  User-defined and default categories for checklists
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key to weddings)
  - `category_name` (text)
  - `is_default` (boolean) - True for system categories
  - `order_index` (integer)
  - `created_at` (timestamptz)

  ### 3. timeline_block_checklist
  Checklist items for each timeline block
  - `id` (uuid, primary key)
  - `timeline_event_id` (uuid, foreign key to wedding_timeline)
  - `item_text` (text)
  - `is_completed` (boolean)
  - `category` (text) - References category_name
  - `order_index` (integer)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. timeline_block_item_categories
  User-defined and default categories for items/utensils
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key to weddings)
  - `category_name` (text)
  - `icon` (text) - Lucide icon name
  - `is_default` (boolean)
  - `order_index` (integer)
  - `created_at` (timestamptz)

  ### 5. timeline_block_items
  Items and utensils needed for each timeline block
  - `id` (uuid, primary key)
  - `timeline_event_id` (uuid, foreign key to wedding_timeline)
  - `item_name` (text)
  - `quantity` (integer)
  - `category` (text)
  - `is_packed` (boolean)
  - `location` (text) - Storage location
  - `notes` (text)
  - `order_index` (integer)
  - `packed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Table Modifications

  ### tasks table
  - Add `timeline_event_id` (uuid, nullable) for linking tasks to timeline events

  ### vendors table
  - Add `timeline_event_id` (uuid, nullable) for linking vendors to timeline events

  ## Security
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their wedding data
  - Ensure data isolation between different weddings

  ## Indexes
  - Foreign key indexes for optimal join performance
  - Composite indexes for common query patterns
*/

-- Create timeline_block_subtasks table
CREATE TABLE IF NOT EXISTS timeline_block_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_event_id uuid NOT NULL REFERENCES wedding_timeline(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_offset_minutes integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 15,
  description text DEFAULT '',
  assigned_to text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create timeline_block_checklist_categories table
CREATE TABLE IF NOT EXISTS timeline_block_checklist_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  is_default boolean DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wedding_id, category_name)
);

-- Create timeline_block_checklist table
CREATE TABLE IF NOT EXISTS timeline_block_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_event_id uuid NOT NULL REFERENCES wedding_timeline(id) ON DELETE CASCADE,
  item_text text NOT NULL,
  is_completed boolean DEFAULT false,
  category text NOT NULL DEFAULT 'Allgemein',
  order_index integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create timeline_block_item_categories table
CREATE TABLE IF NOT EXISTS timeline_block_item_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  icon text DEFAULT 'Package',
  is_default boolean DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wedding_id, category_name)
);

-- Create timeline_block_items table
CREATE TABLE IF NOT EXISTS timeline_block_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_event_id uuid NOT NULL REFERENCES wedding_timeline(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  category text NOT NULL DEFAULT 'Sonstiges',
  is_packed boolean DEFAULT false,
  location text DEFAULT '',
  notes text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  packed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add timeline_event_id to tasks table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'timeline_event_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN timeline_event_id uuid REFERENCES wedding_timeline(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add timeline_event_id to vendors table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'timeline_event_id'
  ) THEN
    ALTER TABLE vendors ADD COLUMN timeline_event_id uuid REFERENCES wedding_timeline(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_timeline_block_subtasks_event ON timeline_block_subtasks(timeline_event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_block_checklist_event ON timeline_block_checklist(timeline_event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_block_items_event ON timeline_block_items(timeline_event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_block_checklist_categories_wedding ON timeline_block_checklist_categories(wedding_id);
CREATE INDEX IF NOT EXISTS idx_timeline_block_item_categories_wedding ON timeline_block_item_categories(wedding_id);
CREATE INDEX IF NOT EXISTS idx_tasks_timeline_event ON tasks(timeline_event_id);
CREATE INDEX IF NOT EXISTS idx_vendors_timeline_event ON vendors(timeline_event_id);

-- Enable Row Level Security
ALTER TABLE timeline_block_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_block_checklist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_block_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_block_item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_block_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timeline_block_subtasks
CREATE POLICY "Users can view subtasks for their wedding events"
  ON timeline_block_subtasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_subtasks.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subtasks for their wedding events"
  ON timeline_block_subtasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_subtasks.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtasks for their wedding events"
  ON timeline_block_subtasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_subtasks.timeline_event_id
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_subtasks.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks for their wedding events"
  ON timeline_block_subtasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_subtasks.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

-- RLS Policies for timeline_block_checklist_categories
CREATE POLICY "Users can view checklist categories for their wedding"
  ON timeline_block_checklist_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_checklist_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checklist categories for their wedding"
  ON timeline_block_checklist_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_checklist_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklist categories for their wedding"
  ON timeline_block_checklist_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_checklist_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_checklist_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checklist categories for their wedding"
  ON timeline_block_checklist_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_checklist_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies for timeline_block_checklist
CREATE POLICY "Users can view checklist items for their wedding events"
  ON timeline_block_checklist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_checklist.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checklist items for their wedding events"
  ON timeline_block_checklist FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_checklist.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklist items for their wedding events"
  ON timeline_block_checklist FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_checklist.timeline_event_id
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_checklist.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checklist items for their wedding events"
  ON timeline_block_checklist FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_checklist.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

-- RLS Policies for timeline_block_item_categories
CREATE POLICY "Users can view item categories for their wedding"
  ON timeline_block_item_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_item_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert item categories for their wedding"
  ON timeline_block_item_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_item_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update item categories for their wedding"
  ON timeline_block_item_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_item_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_item_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete item categories for their wedding"
  ON timeline_block_item_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = timeline_block_item_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies for timeline_block_items
CREATE POLICY "Users can view items for their wedding events"
  ON timeline_block_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_items.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items for their wedding events"
  ON timeline_block_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_items.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items for their wedding events"
  ON timeline_block_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_items.timeline_event_id
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_items.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items for their wedding events"
  ON timeline_block_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_timeline wt
      JOIN weddings w ON wt.wedding_id = w.id
      WHERE wt.id = timeline_block_items.timeline_event_id
      AND w.user_id = auth.uid()
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_timeline_block_subtasks_updated_at ON timeline_block_subtasks;
CREATE TRIGGER update_timeline_block_subtasks_updated_at
  BEFORE UPDATE ON timeline_block_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timeline_block_checklist_updated_at ON timeline_block_checklist;
CREATE TRIGGER update_timeline_block_checklist_updated_at
  BEFORE UPDATE ON timeline_block_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timeline_block_items_updated_at ON timeline_block_items;
CREATE TRIGGER update_timeline_block_items_updated_at
  BEFORE UPDATE ON timeline_block_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
