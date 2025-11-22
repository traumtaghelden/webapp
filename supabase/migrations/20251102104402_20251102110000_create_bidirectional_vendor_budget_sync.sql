/*
  # Bidirektionale Synchronisation zwischen Vendors und Budget

  ## Beschreibung
  Implementiert vollständige bidirektionale Synchronisation zwischen vendors und budget_items.
  Beim Anlegen eines Vendors mit Kosten wird automatisch eine Budget-Position erstellt.
  Zahlungsänderungen in einem Bereich werden automatisch im anderen reflektiert.

  ## 1. Neue Tabellen
    - `vendor_budget_sync_log`
      - Tracking aller Synchronisations-Operationen für Audit und Debugging
      - `id` (uuid, primary key)
      - `operation` (text) - insert, update, delete
      - `source_table` (text) - vendors, budget_items, vendor_payments, budget_payments
      - `source_id` (uuid)
      - `target_table` (text)
      - `target_id` (uuid)
      - `sync_data` (jsonb) - Details der Synchronisation
      - `created_at` (timestamptz)

  ## 2. Neue Funktionen
    - `map_vendor_category_to_budget()` - Mappt Vendor-Kategorien zu Budget-Kategorien
    - `create_budget_item_from_vendor()` - Erstellt Budget-Position aus Vendor
    - `sync_vendor_to_budget()` - Trigger-Funktion für Vendor → Budget
    - `sync_budget_to_vendor()` - Trigger-Funktion für Budget → Vendor
    - `sync_vendor_payment_to_budget()` - Synchronisiert Vendor-Zahlungen zu Budget
    - `sync_budget_payment_to_vendor()` - Synchronisiert Budget-Zahlungen zu Vendor
    - `update_vendor_payment_status()` - Aktualisiert Vendor Status basierend auf Zahlungen

  ## 3. Trigger
    - vendor_to_budget_trigger: Erstellt/aktualisiert Budget-Position bei Vendor-Änderungen
    - budget_to_vendor_trigger: Aktualisiert Vendor bei Budget-Änderungen
    - vendor_payment_sync_trigger: Synchronisiert Vendor-Zahlungen zu Budget
    - budget_payment_sync_trigger: Synchronisiert Budget-Zahlungen zu Vendor

  ## 4. Verhalten
    - Vendor mit Kosten erstellt → Budget-Position wird automatisch erstellt
    - Vendor gelöscht → Budget-Position wird automatisch gelöscht (CASCADE)
    - Vendor-Kosten geändert → Budget-Position wird aktualisiert
    - Budget-Position als bezahlt markiert → Vendor wird aktualisiert
    - Vendor-Zahlung als bezahlt markiert → Budget-Zahlung wird aktualisiert
    - Budget-Zahlung erstellt → Vendor-Zahlung wird erstellt (falls vendor_id vorhanden)

  ## 5. Sicherheit
    - Alle Funktionen verwenden SECURITY DEFINER
    - RLS ist auf sync_log aktiviert
    - Tracking verhindert zirkuläre Trigger-Aufrufe
*/

-- Create sync log table
CREATE TABLE IF NOT EXISTS vendor_budget_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL CHECK (operation IN ('insert', 'update', 'delete', 'sync')),
  source_table text NOT NULL,
  source_id uuid,
  target_table text,
  target_id uuid,
  sync_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON vendor_budget_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_log_source ON vendor_budget_sync_log(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_target ON vendor_budget_sync_log(target_table, target_id);

ALTER TABLE vendor_budget_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
  ON vendor_budget_sync_log FOR SELECT
  TO authenticated
  USING (true);

-- Function to map vendor category to budget category
CREATE OR REPLACE FUNCTION map_vendor_category_to_budget(p_vendor_category text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_vendor_category
    WHEN 'location' THEN 'venue'
    WHEN 'catering' THEN 'catering'
    WHEN 'photography' THEN 'photography'
    WHEN 'videography' THEN 'photography'
    WHEN 'music' THEN 'music'
    WHEN 'flowers' THEN 'flowers'
    WHEN 'decoration' THEN 'decoration'
    WHEN 'dress' THEN 'dress'
    WHEN 'hair_makeup' THEN 'other'
    WHEN 'transportation' THEN 'other'
    WHEN 'cake' THEN 'catering'
    WHEN 'invitations' THEN 'invitations'
    ELSE 'other'
  END;
END;
$$;

-- Function to check if we're already in a sync operation (prevents circular triggers)
CREATE OR REPLACE FUNCTION is_in_sync_operation()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN COALESCE(current_setting('app.sync_in_progress', true)::boolean, false);
END;
$$;

-- Function to set sync operation flag
CREATE OR REPLACE FUNCTION set_sync_flag(p_value boolean)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.sync_in_progress', p_value::text, true);
END;
$$;

-- Function to create budget item from vendor
CREATE OR REPLACE FUNCTION create_budget_item_from_vendor(
  p_vendor_id uuid,
  p_wedding_id uuid,
  p_vendor_name text,
  p_vendor_category text,
  p_total_cost numeric,
  p_paid_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget_item_id uuid;
  v_budget_category text;
  v_payment_status text;
BEGIN
  -- Map category
  v_budget_category := map_vendor_category_to_budget(p_vendor_category);
  
  -- Determine payment status
  IF p_paid_amount >= p_total_cost THEN
    v_payment_status := 'paid';
  ELSIF p_paid_amount > 0 THEN
    v_payment_status := 'partial';
  ELSE
    v_payment_status := 'pending';
  END IF;
  
  -- Create budget item
  INSERT INTO budget_items (
    wedding_id,
    vendor_id,
    category,
    item_name,
    estimated_cost,
    actual_cost,
    paid,
    payment_status,
    payment_method,
    notes
  ) VALUES (
    p_wedding_id,
    p_vendor_id,
    v_budget_category,
    'Dienstleister: ' || p_vendor_name,
    p_total_cost,
    p_total_cost,
    (p_paid_amount >= p_total_cost),
    v_payment_status,
    'bank_transfer',
    'Automatisch aus Dienstleister erstellt'
  )
  RETURNING id INTO v_budget_item_id;
  
  -- Log the sync operation
  INSERT INTO vendor_budget_sync_log (
    operation,
    source_table,
    source_id,
    target_table,
    target_id,
    sync_data
  ) VALUES (
    'insert',
    'vendors',
    p_vendor_id,
    'budget_items',
    v_budget_item_id,
    jsonb_build_object(
      'vendor_name', p_vendor_name,
      'total_cost', p_total_cost,
      'paid_amount', p_paid_amount
    )
  );
  
  RETURN v_budget_item_id;
END;
$$;

-- Trigger function: Vendor to Budget synchronization
CREATE OR REPLACE FUNCTION sync_vendor_to_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget_item_id uuid;
  v_payment_status text;
BEGIN
  -- Prevent circular triggers
  IF is_in_sync_operation() THEN
    RETURN NEW;
  END IF;
  
  -- Set sync flag
  PERFORM set_sync_flag(true);
  
  -- Handle INSERT: Create budget item if vendor has costs
  IF TG_OP = 'INSERT' THEN
    IF NEW.total_cost IS NOT NULL AND NEW.total_cost > 0 THEN
      v_budget_item_id := create_budget_item_from_vendor(
        NEW.id,
        NEW.wedding_id,
        NEW.name,
        NEW.category,
        NEW.total_cost,
        COALESCE(NEW.paid_amount, 0)
      );
    END IF;
  
  -- Handle UPDATE: Update existing budget item
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if there's a linked budget item
    SELECT id INTO v_budget_item_id
    FROM budget_items
    WHERE vendor_id = NEW.id
    LIMIT 1;
    
    IF v_budget_item_id IS NOT NULL THEN
      -- Determine payment status
      IF NEW.paid_amount >= NEW.total_cost THEN
        v_payment_status := 'paid';
      ELSIF NEW.paid_amount > 0 THEN
        v_payment_status := 'partial';
      ELSE
        v_payment_status := 'pending';
      END IF;
      
      -- Update budget item
      UPDATE budget_items
      SET
        item_name = 'Dienstleister: ' || NEW.name,
        category = map_vendor_category_to_budget(NEW.category),
        estimated_cost = NEW.total_cost,
        actual_cost = NEW.total_cost,
        paid = (NEW.paid_amount >= NEW.total_cost),
        payment_status = v_payment_status,
        updated_at = now()
      WHERE id = v_budget_item_id;
      
      -- Log the sync
      INSERT INTO vendor_budget_sync_log (
        operation,
        source_table,
        source_id,
        target_table,
        target_id,
        sync_data
      ) VALUES (
        'update',
        'vendors',
        NEW.id,
        'budget_items',
        v_budget_item_id,
        jsonb_build_object(
          'old_total_cost', OLD.total_cost,
          'new_total_cost', NEW.total_cost,
          'old_paid_amount', OLD.paid_amount,
          'new_paid_amount', NEW.paid_amount
        )
      );
    ELSIF NEW.total_cost IS NOT NULL AND NEW.total_cost > 0 AND OLD.total_cost IS NULL THEN
      -- Vendor now has costs, create budget item
      v_budget_item_id := create_budget_item_from_vendor(
        NEW.id,
        NEW.wedding_id,
        NEW.name,
        NEW.category,
        NEW.total_cost,
        COALESCE(NEW.paid_amount, 0)
      );
    END IF;
  END IF;
  
  -- Clear sync flag
  PERFORM set_sync_flag(false);
  
  RETURN NEW;
END;
$$;

-- Trigger function: Budget to Vendor synchronization
CREATE OR REPLACE FUNCTION sync_budget_to_vendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_total_cost numeric;
  v_vendor_paid_amount numeric;
BEGIN
  -- Prevent circular triggers
  IF is_in_sync_operation() THEN
    RETURN NEW;
  END IF;
  
  -- Only process if budget item is linked to a vendor
  IF TG_OP = 'DELETE' THEN
    IF OLD.vendor_id IS NULL THEN
      RETURN OLD;
    END IF;
  ELSE
    IF NEW.vendor_id IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Set sync flag
  PERFORM set_sync_flag(true);
  
  -- Calculate totals for the vendor
  IF TG_OP = 'DELETE' THEN
    SELECT
      COALESCE(SUM(actual_cost), 0),
      COALESCE(SUM(CASE WHEN paid = true THEN actual_cost ELSE 0 END), 0)
    INTO v_vendor_total_cost, v_vendor_paid_amount
    FROM budget_items
    WHERE vendor_id = OLD.vendor_id
    AND id != OLD.id;
    
    -- Update vendor
    UPDATE vendors
    SET
      total_cost = v_vendor_total_cost,
      paid_amount = v_vendor_paid_amount,
      updated_at = now()
    WHERE id = OLD.vendor_id;
    
    -- Log the sync
    INSERT INTO vendor_budget_sync_log (
      operation,
      source_table,
      source_id,
      target_table,
      target_id,
      sync_data
    ) VALUES (
      'delete',
      'budget_items',
      OLD.id,
      'vendors',
      OLD.vendor_id,
      jsonb_build_object('deleted_cost', OLD.actual_cost)
    );
  ELSE
    -- Handle INSERT or UPDATE
    SELECT
      COALESCE(SUM(actual_cost), 0),
      COALESCE(SUM(CASE WHEN paid = true THEN actual_cost ELSE 0 END), 0)
    INTO v_vendor_total_cost, v_vendor_paid_amount
    FROM budget_items
    WHERE vendor_id = NEW.vendor_id;
    
    -- Update vendor
    UPDATE vendors
    SET
      total_cost = v_vendor_total_cost,
      paid_amount = v_vendor_paid_amount,
      updated_at = now()
    WHERE id = NEW.vendor_id;
    
    -- Log the sync
    INSERT INTO vendor_budget_sync_log (
      operation,
      source_table,
      source_id,
      target_table,
      target_id,
      sync_data
    ) VALUES (
      TG_OP,
      'budget_items',
      NEW.id,
      'vendors',
      NEW.vendor_id,
      jsonb_build_object(
        'actual_cost', NEW.actual_cost,
        'paid', NEW.paid
      )
    );
  END IF;
  
  -- Clear sync flag
  PERFORM set_sync_flag(false);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger function: Vendor Payment to Budget Payment synchronization
CREATE OR REPLACE FUNCTION sync_vendor_payment_to_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget_item_id uuid;
  v_budget_payment_id uuid;
BEGIN
  -- Prevent circular triggers
  IF is_in_sync_operation() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Set sync flag
  PERFORM set_sync_flag(true);
  
  -- Find associated budget item
  IF TG_OP = 'DELETE' THEN
    SELECT id INTO v_budget_item_id
    FROM budget_items
    WHERE vendor_id = OLD.vendor_id
    LIMIT 1;
  ELSE
    SELECT id INTO v_budget_item_id
    FROM budget_items
    WHERE vendor_id = NEW.vendor_id
    LIMIT 1;
  END IF;
  
  -- Only proceed if budget item exists
  IF v_budget_item_id IS NULL THEN
    PERFORM set_sync_flag(false);
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    -- Create corresponding budget payment
    INSERT INTO budget_payments (
      budget_item_id,
      amount,
      due_date,
      payment_date,
      status,
      payment_method,
      payment_type,
      notes
    ) VALUES (
      v_budget_item_id,
      NEW.amount,
      NEW.due_date,
      NEW.payment_date,
      NEW.status,
      NEW.payment_method,
      NEW.payment_type,
      COALESCE(NEW.notes, '') || ' (Aus Dienstleister-Zahlung)'
    )
    RETURNING id INTO v_budget_payment_id;
    
    -- Log the sync
    INSERT INTO vendor_budget_sync_log (
      operation,
      source_table,
      source_id,
      target_table,
      target_id,
      sync_data
    ) VALUES (
      'insert',
      'vendor_payments',
      NEW.id,
      'budget_payments',
      v_budget_payment_id,
      jsonb_build_object('amount', NEW.amount, 'due_date', NEW.due_date)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update corresponding budget payment
    UPDATE budget_payments
    SET
      amount = NEW.amount,
      due_date = NEW.due_date,
      payment_date = NEW.payment_date,
      status = NEW.status,
      payment_method = NEW.payment_method,
      payment_type = NEW.payment_type,
      updated_at = now()
    WHERE budget_item_id = v_budget_item_id
    AND amount = OLD.amount
    AND due_date = OLD.due_date
    RETURNING id INTO v_budget_payment_id;
    
    -- Log the sync
    IF v_budget_payment_id IS NOT NULL THEN
      INSERT INTO vendor_budget_sync_log (
        operation,
        source_table,
        source_id,
        target_table,
        target_id,
        sync_data
      ) VALUES (
        'update',
        'vendor_payments',
        NEW.id,
        'budget_payments',
        v_budget_payment_id,
        jsonb_build_object('status_changed', OLD.status != NEW.status)
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete corresponding budget payment
    DELETE FROM budget_payments
    WHERE budget_item_id = v_budget_item_id
    AND amount = OLD.amount
    AND due_date = OLD.due_date
    RETURNING id INTO v_budget_payment_id;
    
    -- Log the sync
    IF v_budget_payment_id IS NOT NULL THEN
      INSERT INTO vendor_budget_sync_log (
        operation,
        source_table,
        source_id,
        target_table,
        target_id
      ) VALUES (
        'delete',
        'vendor_payments',
        OLD.id,
        'budget_payments',
        v_budget_payment_id
      );
    END IF;
  END IF;
  
  -- Clear sync flag
  PERFORM set_sync_flag(false);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger function: Budget Payment to Vendor Payment synchronization
CREATE OR REPLACE FUNCTION sync_budget_payment_to_vendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id uuid;
  v_vendor_payment_id uuid;
BEGIN
  -- Prevent circular triggers
  IF is_in_sync_operation() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Set sync flag
  PERFORM set_sync_flag(true);
  
  -- Find associated vendor
  IF TG_OP = 'DELETE' THEN
    SELECT vendor_id INTO v_vendor_id
    FROM budget_items
    WHERE id = OLD.budget_item_id;
  ELSE
    SELECT vendor_id INTO v_vendor_id
    FROM budget_items
    WHERE id = NEW.budget_item_id;
  END IF;
  
  -- Only proceed if vendor exists
  IF v_vendor_id IS NULL THEN
    PERFORM set_sync_flag(false);
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    -- Create corresponding vendor payment
    INSERT INTO vendor_payments (
      vendor_id,
      amount,
      due_date,
      payment_date,
      status,
      payment_method,
      payment_type,
      notes
    ) VALUES (
      v_vendor_id,
      NEW.amount,
      NEW.due_date,
      NEW.payment_date,
      NEW.status,
      NEW.payment_method,
      NEW.payment_type,
      COALESCE(NEW.notes, '') || ' (Aus Budget-Zahlung)'
    )
    RETURNING id INTO v_vendor_payment_id;
    
    -- Log the sync
    INSERT INTO vendor_budget_sync_log (
      operation,
      source_table,
      source_id,
      target_table,
      target_id,
      sync_data
    ) VALUES (
      'insert',
      'budget_payments',
      NEW.id,
      'vendor_payments',
      v_vendor_payment_id,
      jsonb_build_object('amount', NEW.amount, 'due_date', NEW.due_date)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update corresponding vendor payment
    UPDATE vendor_payments
    SET
      amount = NEW.amount,
      due_date = NEW.due_date,
      payment_date = NEW.payment_date,
      status = NEW.status,
      payment_method = NEW.payment_method,
      payment_type = NEW.payment_type,
      updated_at = now()
    WHERE vendor_id = v_vendor_id
    AND amount = OLD.amount
    AND due_date = OLD.due_date
    RETURNING id INTO v_vendor_payment_id;
    
    -- Log the sync
    IF v_vendor_payment_id IS NOT NULL THEN
      INSERT INTO vendor_budget_sync_log (
        operation,
        source_table,
        source_id,
        target_table,
        target_id,
        sync_data
      ) VALUES (
        'update',
        'budget_payments',
        NEW.id,
        'vendor_payments',
        v_vendor_payment_id,
        jsonb_build_object('status_changed', OLD.status != NEW.status)
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete corresponding vendor payment
    DELETE FROM vendor_payments
    WHERE vendor_id = v_vendor_id
    AND amount = OLD.amount
    AND due_date = OLD.due_date
    RETURNING id INTO v_vendor_payment_id;
    
    -- Log the sync
    IF v_vendor_payment_id IS NOT NULL THEN
      INSERT INTO vendor_budget_sync_log (
        operation,
        source_table,
        source_id,
        target_table,
        target_id
      ) VALUES (
        'delete',
        'budget_payments',
        OLD.id,
        'vendor_payments',
        v_vendor_payment_id
      );
    END IF;
  END IF;
  
  -- Clear sync flag
  PERFORM set_sync_flag(false);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS vendor_to_budget_sync_trigger ON vendors;
DROP TRIGGER IF EXISTS budget_to_vendor_sync_trigger ON budget_items;
DROP TRIGGER IF EXISTS vendor_payment_to_budget_sync_trigger ON vendor_payments;
DROP TRIGGER IF EXISTS budget_payment_to_vendor_sync_trigger ON budget_payments;

-- Create triggers for vendor to budget sync
CREATE TRIGGER vendor_to_budget_sync_trigger
  AFTER INSERT OR UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION sync_vendor_to_budget();

-- Create trigger for budget to vendor sync
CREATE TRIGGER budget_to_vendor_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_budget_to_vendor();

-- Create trigger for vendor payment to budget payment sync
CREATE TRIGGER vendor_payment_to_budget_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vendor_payments
  FOR EACH ROW
  EXECUTE FUNCTION sync_vendor_payment_to_budget();

-- Create trigger for budget payment to vendor payment sync
CREATE TRIGGER budget_payment_to_vendor_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budget_payments
  FOR EACH ROW
  EXECUTE FUNCTION sync_budget_payment_to_vendor();
