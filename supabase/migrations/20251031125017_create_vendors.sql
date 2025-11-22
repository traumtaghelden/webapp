/*
  # Vendor/Dienstleister-Verwaltung

  1. Neue Tabellen
    - `vendors`
      - `id` (uuid, primary key) - Eindeutige ID
      - `wedding_id` (uuid) - Referenz zur Hochzeit
      - `name` (text) - Name des Dienstleisters
      - `category` (text) - Kategorie (location, catering, photography, etc.)
      - `contact_name` (text, nullable) - Ansprechpartner
      - `email` (text, nullable) - E-Mail-Adresse
      - `phone` (text, nullable) - Telefonnummer
      - `address` (text, nullable) - Adresse
      - `website` (text, nullable) - Webseite
      - `contract_status` (text) - Status (inquiry, pending, signed, completed)
      - `total_cost` (decimal, nullable) - Gesamtkosten
      - `paid_amount` (decimal) - Bereits bezahlter Betrag
      - `payment_due_date` (date, nullable) - Zahlungsfrist
      - `rating` (integer, nullable) - Bewertung 1-5
      - `notes` (text, nullable) - Notizen
      - `created_at` (timestamptz) - Erstellungszeitpunkt
      - `updated_at` (timestamptz) - Aktualisierungszeitpunkt

  2. Security
    - Enable RLS on `vendors` table
    - Users can manage vendors for their weddings
*/

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  website text,
  contract_status text DEFAULT 'inquiry',
  total_cost decimal(10, 2),
  paid_amount decimal(10, 2) DEFAULT 0,
  payment_due_date date,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendors for their weddings"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vendors for their weddings"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vendors for their weddings"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vendors for their weddings"
  ON vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_vendors_wedding_id ON vendors(wedding_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_contract_status ON vendors(contract_status);