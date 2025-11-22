/*
  # Create Vendor Activity Log System

  1. New Tables
    - `vendor_activity_log`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendors)
      - `user_id` (uuid, foreign key to auth.users)
      - `action_type` (text) - created, updated, status_changed, payment_added, document_uploaded, deleted
      - `changes` (jsonb) - stores before/after values
      - `description` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `vendor_activity_log` table
    - Add policies for authenticated users

  3. Indexes
    - Index on vendor_id for fast lookups
    - Index on action_type for filtering
    - Index on created_at for timeline sorting

  4. Triggers
    - Auto-log vendor changes
*/

-- Create vendor_activity_log table
CREATE TABLE IF NOT EXISTS vendor_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'status_changed', 'payment_added', 'payment_updated', 'document_uploaded', 'document_deleted', 'deleted')),
  changes jsonb DEFAULT '{}'::jsonb,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_activity_log_vendor_id ON vendor_activity_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_log_action_type ON vendor_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_log_created_at ON vendor_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_log_user_id ON vendor_activity_log(user_id);

-- Enable Row Level Security
ALTER TABLE vendor_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own vendor activity logs"
  ON vendor_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_activity_log.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own vendor activity logs"
  ON vendor_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_activity_log.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

-- Create trigger function to log vendor changes
CREATE OR REPLACE FUNCTION log_vendor_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes jsonb;
  v_description text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_changes := jsonb_build_object('new', row_to_json(NEW));
    v_description := 'Dienstleister erstellt: ' || NEW.name;
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (NEW.id, auth.uid(), 'created', v_changes, v_description);
    
  ELSIF (TG_OP = 'UPDATE') THEN
    v_changes := jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
    
    IF (OLD.contract_status != NEW.contract_status) THEN
      v_description := 'Status geändert von ' || OLD.contract_status || ' zu ' || NEW.contract_status;
      INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
      VALUES (NEW.id, auth.uid(), 'status_changed', v_changes, v_description);
    ELSE
      v_description := 'Dienstleister aktualisiert';
      INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
      VALUES (NEW.id, auth.uid(), 'updated', v_changes, v_description);
    END IF;
    
  ELSIF (TG_OP = 'DELETE') THEN
    v_changes := jsonb_build_object('old', row_to_json(OLD));
    v_description := 'Dienstleister gelöscht: ' || OLD.name;
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (OLD.id, auth.uid(), 'deleted', v_changes, v_description);
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for vendor changes
DROP TRIGGER IF EXISTS trigger_log_vendor_changes ON vendors;
CREATE TRIGGER trigger_log_vendor_changes
  AFTER INSERT OR UPDATE OR DELETE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION log_vendor_changes();

-- Create trigger function to log payment changes
CREATE OR REPLACE FUNCTION log_vendor_payment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes jsonb;
  v_description text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_changes := jsonb_build_object('new', row_to_json(NEW));
    v_description := 'Zahlung hinzugefügt: ' || NEW.amount::text || '€';
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (NEW.vendor_id, auth.uid(), 'payment_added', v_changes, v_description);
    
  ELSIF (TG_OP = 'UPDATE') THEN
    v_changes := jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
    v_description := 'Zahlung aktualisiert: ' || NEW.amount::text || '€';
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (NEW.vendor_id, auth.uid(), 'payment_updated', v_changes, v_description);
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for payment changes
DROP TRIGGER IF EXISTS trigger_log_vendor_payment_changes ON vendor_payments;
CREATE TRIGGER trigger_log_vendor_payment_changes
  AFTER INSERT OR UPDATE ON vendor_payments
  FOR EACH ROW
  EXECUTE FUNCTION log_vendor_payment_changes();

-- Create trigger function to log attachment changes
CREATE OR REPLACE FUNCTION log_vendor_attachment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes jsonb;
  v_description text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_changes := jsonb_build_object('new', row_to_json(NEW));
    v_description := 'Dokument hochgeladen: ' || NEW.file_name;
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (NEW.vendor_id, auth.uid(), 'document_uploaded', v_changes, v_description);
    
  ELSIF (TG_OP = 'DELETE') THEN
    v_changes := jsonb_build_object('old', row_to_json(OLD));
    v_description := 'Dokument gelöscht: ' || OLD.file_name;
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (OLD.vendor_id, auth.uid(), 'document_deleted', v_changes, v_description);
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for attachment changes
DROP TRIGGER IF EXISTS trigger_log_vendor_attachment_changes ON vendor_attachments;
CREATE TRIGGER trigger_log_vendor_attachment_changes
  AFTER INSERT OR DELETE ON vendor_attachments
  FOR EACH ROW
  EXECUTE FUNCTION log_vendor_attachment_changes();
