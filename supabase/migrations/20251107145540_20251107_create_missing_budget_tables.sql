/*
  # Create Missing Budget-Related Tables

  1. New Tables
    - `budget_attachments` - Store attachments for budget items
    - `budget_partner_splits` - Track how costs are split between partners
    - `budget_item_tags` - Junction table for budget items and tags
    - `budget_tags` - Tags for categorizing budget items
    - `vendors` - Vendor management table

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create budget_tags table
CREATE TABLE IF NOT EXISTS budget_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#d4af37',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget tags"
  ON budget_tags FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own budget tags"
  ON budget_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own budget tags"
  ON budget_tags FOR UPDATE
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

CREATE POLICY "Users can delete own budget tags"
  ON budget_tags FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Create budget_item_tags junction table
CREATE TABLE IF NOT EXISTS budget_item_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id uuid NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES budget_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(budget_item_id, tag_id)
);

ALTER TABLE budget_item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget item tags"
  ON budget_item_tags FOR SELECT
  TO authenticated
  USING (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own budget item tags"
  ON budget_item_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own budget item tags"
  ON budget_item_tags FOR DELETE
  TO authenticated
  USING (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

-- Create budget_attachments table
CREATE TABLE IF NOT EXISTS budget_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id uuid NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget attachments"
  ON budget_attachments FOR SELECT
  TO authenticated
  USING (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own budget attachments"
  ON budget_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own budget attachments"
  ON budget_attachments FOR DELETE
  TO authenticated
  USING (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

-- Create budget_partner_splits table
CREATE TABLE IF NOT EXISTS budget_partner_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id uuid NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
  partner_name text NOT NULL,
  split_percentage numeric DEFAULT 50,
  amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_partner_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget partner splits"
  ON budget_partner_splits FOR SELECT
  TO authenticated
  USING (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own budget partner splits"
  ON budget_partner_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own budget partner splits"
  ON budget_partner_splits FOR UPDATE
  TO authenticated
  USING (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own budget partner splits"
  ON budget_partner_splits FOR DELETE
  TO authenticated
  USING (
    budget_item_id IN (
      SELECT id FROM budget_items WHERE wedding_id IN (
        SELECT id FROM weddings WHERE user_id = auth.uid()
      )
    )
  );

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  contact_person text,
  email text,
  phone text,
  website text,
  address text,
  notes text,
  status text DEFAULT 'researching',
  rating numeric,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  contract_signed boolean DEFAULT false,
  deposit_paid boolean DEFAULT false,
  deposit_amount numeric DEFAULT 0,
  payment_due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own vendors"
  ON vendors FOR UPDATE
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

CREATE POLICY "Users can delete own vendors"
  ON vendors FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_tags_wedding_id ON budget_tags(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_tags_budget_item_id ON budget_item_tags(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_tags_tag_id ON budget_item_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_budget_attachments_budget_item_id ON budget_attachments(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_partner_splits_budget_item_id ON budget_partner_splits(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_vendors_wedding_id ON vendors(wedding_id);