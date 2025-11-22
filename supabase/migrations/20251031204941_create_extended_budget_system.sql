/*
  # Erweitertes Budget-System

  ## Neue Tabellen
  
  1. **budget_categories**
     - `id` (uuid, primary key)
     - `wedding_id` (uuid, foreign key)
     - `name` (text) - Anpassbarer Kategorie-Name
     - `icon` (text) - Icon-Name für die Kategorie
     - `color` (text) - Farbe für die Kategorie
     - `budget_limit` (numeric) - Budget-Limit für diese Kategorie
     - `parent_category_id` (uuid, nullable) - Für Unterkategorien
     - `order_index` (integer) - Sortierreihenfolge
     - `is_default` (boolean) - Standard-Kategorie oder benutzerdefiniert
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. **budget_payments**
     - `id` (uuid, primary key)
     - `budget_item_id` (uuid, foreign key)
     - `amount` (numeric) - Zahlungsbetrag
     - `payment_date` (date) - Datum der Zahlung
     - `due_date` (date) - Fälligkeitsdatum
     - `payment_method` (text) - Zahlungsmethode (Überweisung, Karte, Bar, etc.)
     - `status` (text) - Status (pending, paid, overdue, cancelled)
     - `notes` (text)
     - `receipt_url` (text) - Link zur Quittung
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  3. **budget_attachments**
     - `id` (uuid, primary key)
     - `budget_item_id` (uuid, foreign key)
     - `file_name` (text)
     - `file_url` (text) - URL in Supabase Storage
     - `file_size` (bigint) - Dateigröße in Bytes
     - `file_type` (text) - MIME-Type
     - `attachment_type` (text) - invoice, contract, quote, receipt, other
     - `uploaded_by` (uuid) - User ID
     - `created_at` (timestamptz)

  4. **budget_partner_splits**
     - `id` (uuid, primary key)
     - `budget_item_id` (uuid, foreign key)
     - `partner_type` (text) - partner_1 oder partner_2
     - `amount` (numeric) - Betrag für diesen Partner
     - `percentage` (numeric) - Prozentsatz (0-100)
     - `paid_amount` (numeric) - Bereits bezahlter Betrag
     - `notes` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  5. **budget_tags**
     - `id` (uuid, primary key)
     - `wedding_id` (uuid, foreign key)
     - `name` (text)
     - `color` (text)
     - `created_at` (timestamptz)

  6. **budget_item_tags**
     - `budget_item_id` (uuid, foreign key)
     - `tag_id` (uuid, foreign key)
     - `created_at` (timestamptz)
     - Primary key über beide IDs

  ## Änderungen an bestehenden Tabellen

  7. **budget_items** - Neue Felder hinzufügen
     - `payment_method` (text)
     - `tax_rate` (numeric) - Steuersatz in Prozent
     - `discount_amount` (numeric) - Rabattbetrag
     - `discount_percentage` (numeric) - Rabatt in Prozent
     - `notes` (text) - Umfangreiche Notizen
     - `priority` (text) - low, medium, high
     - `currency` (text) - Währungscode (EUR, USD, etc.)
     - `payment_status` (text) - pending, partial, paid, overdue
     - `contract_signed` (boolean)
     - `deposit_amount` (numeric) - Anzahlungsbetrag
     - `deposit_paid` (boolean)
     - `final_payment_due` (date)

  ## Sicherheit
  - RLS aktiviert für alle neuen Tabellen
  - Policies für authenticated users basierend auf wedding_id
*/

-- Budget Categories Tabelle
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text DEFAULT 'DollarSign',
  color text DEFAULT '#d4af37',
  budget_limit numeric DEFAULT 0,
  parent_category_id uuid REFERENCES budget_categories(id) ON DELETE SET NULL,
  order_index integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget categories for their wedding"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget categories for their wedding"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget categories for their wedding"
  ON budget_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget categories for their wedding"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget Payments Tabelle
CREATE TABLE IF NOT EXISTS budget_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_date date,
  due_date date,
  payment_method text DEFAULT 'bank_transfer',
  status text DEFAULT 'pending',
  notes text DEFAULT '',
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget payments for their wedding"
  ON budget_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget payments for their wedding"
  ON budget_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget payments for their wedding"
  ON budget_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget payments for their wedding"
  ON budget_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget Attachments Tabelle
CREATE TABLE IF NOT EXISTS budget_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text DEFAULT 'application/pdf',
  attachment_type text DEFAULT 'other',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget attachments for their wedding"
  ON budget_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_attachments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget attachments for their wedding"
  ON budget_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_attachments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget attachments for their wedding"
  ON budget_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_attachments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget Partner Splits Tabelle
CREATE TABLE IF NOT EXISTS budget_partner_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  partner_type text NOT NULL,
  amount numeric DEFAULT 0,
  percentage numeric DEFAULT 50,
  paid_amount numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_partner_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view partner splits for their wedding"
  ON budget_partner_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert partner splits for their wedding"
  ON budget_partner_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update partner splits for their wedding"
  ON budget_partner_splits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete partner splits for their wedding"
  ON budget_partner_splits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget Tags Tabelle
CREATE TABLE IF NOT EXISTS budget_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#d4af37',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget tags for their wedding"
  ON budget_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget tags for their wedding"
  ON budget_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget tags for their wedding"
  ON budget_tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget tags for their wedding"
  ON budget_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget Item Tags Junction Tabelle
CREATE TABLE IF NOT EXISTS budget_item_tags (
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES budget_tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (budget_item_id, tag_id)
);

ALTER TABLE budget_item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget item tags for their wedding"
  ON budget_item_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_item_tags.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget item tags for their wedding"
  ON budget_item_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_item_tags.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget item tags for their wedding"
  ON budget_item_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_item_tags.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Erweitere budget_items Tabelle mit neuen Feldern
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'payment_method') THEN
    ALTER TABLE budget_items ADD COLUMN payment_method text DEFAULT 'bank_transfer';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'tax_rate') THEN
    ALTER TABLE budget_items ADD COLUMN tax_rate numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'discount_amount') THEN
    ALTER TABLE budget_items ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'discount_percentage') THEN
    ALTER TABLE budget_items ADD COLUMN discount_percentage numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'notes') THEN
    ALTER TABLE budget_items ADD COLUMN notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'priority') THEN
    ALTER TABLE budget_items ADD COLUMN priority text DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'currency') THEN
    ALTER TABLE budget_items ADD COLUMN currency text DEFAULT 'EUR';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'payment_status') THEN
    ALTER TABLE budget_items ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'contract_signed') THEN
    ALTER TABLE budget_items ADD COLUMN contract_signed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'deposit_amount') THEN
    ALTER TABLE budget_items ADD COLUMN deposit_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'deposit_paid') THEN
    ALTER TABLE budget_items ADD COLUMN deposit_paid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'final_payment_due') THEN
    ALTER TABLE budget_items ADD COLUMN final_payment_due date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'vendor_id') THEN
    ALTER TABLE budget_items ADD COLUMN vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_budget_categories_wedding_id ON budget_categories(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_payments_budget_item_id ON budget_payments(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_payments_due_date ON budget_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_budget_attachments_budget_item_id ON budget_attachments(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_partner_splits_budget_item_id ON budget_partner_splits(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_tags_wedding_id ON budget_tags(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_tags_budget_item_id ON budget_item_tags(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_tags_tag_id ON budget_item_tags(tag_id);
