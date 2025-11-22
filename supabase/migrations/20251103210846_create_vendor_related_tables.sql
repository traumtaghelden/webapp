/*
  # Vendor-Related Tables erstellen

  ## Beschreibung
  Diese Migration erstellt fehlende Tabellen für das Dienstleister-Modul:

  ## 1. Neue Tabellen
    - `vendor_payments` - Zahlungen an Dienstleister
      - Zahlungstypen: deposit, milestone, final, monthly
      - Status-Tracking: pending, paid, overdue, cancelled
      - Verknüpfung mit Budget-System
    
    - `vendor_attachments` - Dokumente & Anhänge
      - Verträge, Rechnungen, Angebote
      - Supabase Storage Integration
      - Typ-Kategorisierung
    
    - `vendor_activity_log` - Aktivitäts-Historie
      - Change-Tracking für Vendor-Daten
      - Audit-Trail
      - Benutzer-Attribution

  ## 2. Sicherheit
    - RLS aktiviert für alle Tabellen
    - Policies basierend auf wedding_id
    - Nur authentifizierte User mit Zugriff auf die Hochzeit

  ## 3. Performance
    - Indizes auf Foreign Keys
    - Indizes für häufige Queries (vendor_id, due_date)
*/

-- ============================================================================
-- VENDOR PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  payment_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_type text DEFAULT 'milestone' CHECK (payment_type IN ('deposit', 'milestone', 'final', 'monthly')),
  payment_method text DEFAULT 'bank_transfer',
  notes text,
  percentage_of_total numeric,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_due_date ON vendor_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_status ON vendor_payments(status);

ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendor payments for their weddings"
  ON vendor_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_payments.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vendor payments for their weddings"
  ON vendor_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_payments.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vendor payments for their weddings"
  ON vendor_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_payments.vendor_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_payments.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vendor payments for their weddings"
  ON vendor_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_payments.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VENDOR ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text DEFAULT 'application/pdf',
  attachment_type text DEFAULT 'other' CHECK (attachment_type IN ('contract', 'invoice', 'quote', 'receipt', 'other')),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_attachments_vendor_id ON vendor_attachments(vendor_id);

ALTER TABLE vendor_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendor attachments for their weddings"
  ON vendor_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_attachments.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vendor attachments for their weddings"
  ON vendor_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_attachments.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vendor attachments for their weddings"
  ON vendor_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_attachments.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VENDOR ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_activity_vendor_id ON vendor_activity_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_created_at ON vendor_activity_log(created_at DESC);

ALTER TABLE vendor_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendor activity for their weddings"
  ON vendor_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_activity_log.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vendor activity for their weddings"
  ON vendor_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_activity_log.vendor_id
      AND weddings.user_id = auth.uid()
    )
  );
