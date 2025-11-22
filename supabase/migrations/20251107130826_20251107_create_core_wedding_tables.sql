/*
  # Core Wedding Planning Tables

  ## Übersicht
  Erstellt die grundlegenden Tabellen für die Hochzeitsplanungs-App.

  ## Neue Tabellen
  
  1. **weddings** - Haupttabelle für Hochzeiten
     - id (uuid, primary key)
     - user_id (uuid, foreign key zu auth.users)
     - partner_1_name, partner_2_name (text)
     - wedding_date (date)
     - guest_count (integer)
     - total_budget (numeric)
     - onboarding_completed (boolean)
     
  2. **budget_categories** - Budget-Kategorien
     - id (uuid, primary key)
     - wedding_id (uuid, foreign key)
     - name (text) - Name der Kategorie
     - color (text) - Farbe für UI
     - budget_limit (numeric) - Budget-Limit
     
  3. **budget_items** - Budget-Einträge
     - id (uuid, primary key)
     - wedding_id (uuid, foreign key)
     - category (text) - Kategorie-Name
     - item_name (text) - Bezeichnung
     - estimated_cost (numeric) - Geplante Kosten
     - actual_cost (numeric) - Tatsächliche Kosten
     - paid (boolean) - Bezahlt Status
     - payment_status (text) - Status
     - is_per_person (boolean) - Pro-Kopf-Berechnung
     - cost_per_person (numeric) - Kosten pro Person
     
  4. **budget_payments** - Zahlungspläne
     - id (uuid, primary key)
     - budget_item_id (uuid, foreign key)
     - amount (numeric)
     - due_date (date)
     - status (text)
     - notes (text)
     - payment_method (text)

  ## Sicherheit
  - RLS aktiviert für alle Tabellen
  - Benutzer können nur ihre eigenen Daten sehen und bearbeiten
*/

-- Weddings Tabelle
CREATE TABLE IF NOT EXISTS weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner_1_name text NOT NULL,
  partner_2_name text,
  wedding_date date,
  guest_count integer DEFAULT 0,
  total_budget numeric DEFAULT 0,
  venue text,
  location text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weddings"
  ON weddings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weddings"
  ON weddings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weddings"
  ON weddings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weddings"
  ON weddings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Budget Categories Tabelle
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#d4af37',
  budget_limit numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget categories for their weddings"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget categories for their weddings"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget categories for their weddings"
  ON budget_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget categories for their weddings"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget Items Tabelle
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  item_name text NOT NULL,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  paid boolean DEFAULT false,
  payment_status text DEFAULT 'pending',
  payment_method text DEFAULT 'bank_transfer',
  priority text DEFAULT 'medium',
  notes text,
  currency text DEFAULT 'EUR',
  tax_rate numeric DEFAULT 0,
  is_per_person boolean DEFAULT false,
  cost_per_person numeric,
  vendor_id uuid,
  timeline_event_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget items for their weddings"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget items for their weddings"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget items for their weddings"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget items for their weddings"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget Payments Tabelle
CREATE TABLE IF NOT EXISTS budget_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  due_date date,
  payment_date date,
  status text DEFAULT 'pending',
  notes text,
  payment_method text DEFAULT 'bank_transfer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget payments for their weddings"
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

CREATE POLICY "Users can insert budget payments for their weddings"
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

CREATE POLICY "Users can update budget payments for their weddings"
  ON budget_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget payments for their weddings"
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