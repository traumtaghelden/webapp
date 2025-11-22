/*
  # Create Vendor Payments System

  1. New Tables
    - `vendor_payments`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendors)
      - `amount` (numeric)
      - `due_date` (date)
      - `payment_date` (date, nullable)
      - `status` (text) - pending, paid, overdue, cancelled
      - `payment_type` (text) - deposit, milestone, final, monthly
      - `payment_method` (text)
      - `notes` (text)
      - `percentage_of_total` (numeric, nullable)
      - `receipt_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `vendor_payments` table
    - Add policies for authenticated users to manage their vendor payments

  3. Indexes
    - Index on vendor_id for fast lookups
    - Index on due_date for payment scheduling queries
    - Index on status for filtering

  4. Functions
    - Auto-update payment status to 'overdue' when due_date passes
*/

-- Create vendor_payments table
CREATE TABLE IF NOT EXISTS vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  due_date date NOT NULL,
  payment_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_type text NOT NULL DEFAULT 'milestone' CHECK (payment_type IN ('deposit', 'milestone', 'final', 'monthly')),
  payment_method text DEFAULT 'bank_transfer',
  notes text DEFAULT '',
  percentage_of_total numeric CHECK (percentage_of_total >= 0 AND percentage_of_total <= 100),
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_due_date ON vendor_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_status ON vendor_payments(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_payment_date ON vendor_payments(payment_date);

-- Enable Row Level Security
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own vendor payments"
  ON vendor_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_payments.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own vendor payments"
  ON vendor_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_payments.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own vendor payments"
  ON vendor_payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_payments.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_payments.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own vendor payments"
  ON vendor_payments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_payments.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_vendor_payments_updated_at
  BEFORE UPDATE ON vendor_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_payments_updated_at();

-- Create function to auto-update overdue payments
CREATE OR REPLACE FUNCTION update_overdue_vendor_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendor_payments
  SET status = 'overdue'
  WHERE status = 'pending'
  AND due_date < CURRENT_DATE;
END;
$$;
