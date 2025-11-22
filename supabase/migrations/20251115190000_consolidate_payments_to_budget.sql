/*
  # Consolidate Payment System to Budget Module

  1. Changes
    - Add location_id to budget_items if not exists
    - Drop old bidirectional sync triggers
    - Migrate existing vendor_payments data to budget_payments
    - Create budget_items for vendors that don't have them yet
    - Drop vendor_payments table
    - Add new triggers to auto-update vendor/location costs

  2. New Functions
    - update_vendor_costs_from_budget() - Updates vendor total_cost and paid_amount
    - update_location_costs_from_budget() - Updates location total_cost

  3. Security
    - All payment operations happen through budget module only
*/

-- Step 0: Add location_id to budget_items if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_items' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_budget_items_location_id ON budget_items(location_id);
  END IF;
END $$;

-- Step 1: Drop old bidirectional sync triggers and functions
DROP TRIGGER IF EXISTS vendor_to_budget_sync_trigger ON vendors;
DROP TRIGGER IF EXISTS budget_to_vendor_sync_trigger ON budget_items;
DROP TRIGGER IF EXISTS vendor_payment_to_budget_sync_trigger ON vendor_payments;
DROP TRIGGER IF EXISTS budget_payment_to_vendor_sync_trigger ON budget_payments;

DROP FUNCTION IF EXISTS sync_vendor_to_budget();
DROP FUNCTION IF EXISTS sync_budget_to_vendor();
DROP FUNCTION IF EXISTS sync_vendor_payment_to_budget();
DROP FUNCTION IF EXISTS sync_budget_payment_to_vendor();
DROP FUNCTION IF EXISTS create_budget_item_from_vendor(uuid, uuid, text, text, numeric, numeric);
DROP FUNCTION IF EXISTS map_vendor_category_to_budget(text);
DROP FUNCTION IF EXISTS is_in_sync_operation();
DROP FUNCTION IF EXISTS set_sync_flag(boolean);

-- Step 2: Create budget_items for vendors that have vendor_payments but no budget_item
DO $$
DECLARE
  vendor_record RECORD;
  new_budget_item_id uuid;
BEGIN
  FOR vendor_record IN
    SELECT DISTINCT v.id, v.wedding_id, v.name, v.category
    FROM vendors v
    WHERE EXISTS (SELECT 1 FROM vendor_payments vp WHERE vp.vendor_id = v.id)
    AND NOT EXISTS (SELECT 1 FROM budget_items bi WHERE bi.vendor_id = v.id)
  LOOP
    INSERT INTO budget_items (
      wedding_id,
      vendor_id,
      item_name,
      category,
      estimated_cost,
      actual_cost,
      paid,
      created_at
    )
    VALUES (
      vendor_record.wedding_id,
      vendor_record.id,
      vendor_record.name || ' - Dienstleistung',
      vendor_record.category,
      (SELECT COALESCE(SUM(amount), 0) FROM vendor_payments WHERE vendor_id = vendor_record.id),
      0,
      false,
      now()
    )
    RETURNING id INTO new_budget_item_id;

    INSERT INTO budget_payments (
      budget_item_id,
      amount,
      due_date,
      payment_date,
      status,
      payment_method,
      notes,
      created_at
    )
    SELECT
      new_budget_item_id,
      amount,
      due_date,
      payment_date,
      status,
      COALESCE(payment_method, 'bank_transfer'),
      COALESCE(notes, ''),
      created_at
    FROM vendor_payments
    WHERE vendor_id = vendor_record.id;
  END LOOP;
END $$;

-- Step 3: For vendors that already have budget_items, link the vendor_payments
DO $$
DECLARE
  vendor_record RECORD;
  budget_item_record RECORD;
BEGIN
  FOR vendor_record IN
    SELECT DISTINCT v.id, v.wedding_id
    FROM vendors v
    WHERE EXISTS (SELECT 1 FROM vendor_payments vp WHERE vp.vendor_id = v.id)
    AND EXISTS (SELECT 1 FROM budget_items bi WHERE bi.vendor_id = v.id)
  LOOP
    SELECT id INTO budget_item_record
    FROM budget_items
    WHERE vendor_id = vendor_record.id
    LIMIT 1;

    INSERT INTO budget_payments (
      budget_item_id,
      amount,
      due_date,
      payment_date,
      status,
      payment_method,
      notes,
      created_at
    )
    SELECT
      budget_item_record.id,
      amount,
      due_date,
      payment_date,
      status,
      COALESCE(payment_method, 'bank_transfer'),
      COALESCE(notes, ''),
      created_at
    FROM vendor_payments
    WHERE vendor_id = vendor_record.id
    AND NOT EXISTS (
      SELECT 1 FROM budget_payments bp
      WHERE bp.budget_item_id = budget_item_record.id
      AND bp.amount = vendor_payments.amount
      AND bp.due_date = vendor_payments.due_date
    );
  END LOOP;
END $$;

-- Step 4: Drop vendor_payments table
DROP TRIGGER IF EXISTS set_vendor_payments_updated_at ON vendor_payments;
DROP FUNCTION IF EXISTS update_vendor_payments_updated_at();
DROP FUNCTION IF EXISTS update_overdue_vendor_payments();
DROP TABLE IF EXISTS vendor_payments CASCADE;

-- Step 5: Create function to update vendor costs from budget_items
CREATE OR REPLACE FUNCTION update_vendor_costs_from_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_vendor_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_vendor_id := OLD.vendor_id;
  ELSE
    affected_vendor_id := NEW.vendor_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.vendor_id IS DISTINCT FROM NEW.vendor_id THEN
    UPDATE vendors SET
      total_cost = (
        SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0)
        FROM budget_items
        WHERE vendor_id = OLD.vendor_id
      ),
      paid_amount = (
        SELECT COALESCE(SUM(bp.amount), 0)
        FROM budget_payments bp
        JOIN budget_items bi ON bi.id = bp.budget_item_id
        WHERE bi.vendor_id = OLD.vendor_id
        AND bp.status = 'paid'
      )
    WHERE id = OLD.vendor_id;
  END IF;

  IF affected_vendor_id IS NOT NULL THEN
    UPDATE vendors SET
      total_cost = (
        SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0)
        FROM budget_items
        WHERE vendor_id = affected_vendor_id
      ),
      paid_amount = (
        SELECT COALESCE(SUM(bp.amount), 0)
        FROM budget_payments bp
        JOIN budget_items bi ON bi.id = bp.budget_item_id
        WHERE bi.vendor_id = affected_vendor_id
        AND bp.status = 'paid'
      )
    WHERE id = affected_vendor_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Step 6: Create function to update location costs
CREATE OR REPLACE FUNCTION update_location_costs_from_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_location_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_location_id := OLD.location_id;
  ELSE
    affected_location_id := NEW.location_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.location_id IS DISTINCT FROM NEW.location_id THEN
    UPDATE locations SET
      total_cost = (
        SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0)
        FROM budget_items
        WHERE location_id = OLD.location_id
      )
    WHERE id = OLD.location_id;
  END IF;

  IF affected_location_id IS NOT NULL THEN
    UPDATE locations SET
      total_cost = (
        SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0)
        FROM budget_items
        WHERE location_id = affected_location_id
      )
    WHERE id = affected_location_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Step 7: Create function to update vendor paid_amount
CREATE OR REPLACE FUNCTION update_vendor_paid_amount_from_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_vendor_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT vendor_id INTO affected_vendor_id
    FROM budget_items
    WHERE id = OLD.budget_item_id;
  ELSE
    SELECT vendor_id INTO affected_vendor_id
    FROM budget_items
    WHERE id = NEW.budget_item_id;
  END IF;

  IF affected_vendor_id IS NOT NULL THEN
    UPDATE vendors SET
      paid_amount = (
        SELECT COALESCE(SUM(bp.amount), 0)
        FROM budget_payments bp
        JOIN budget_items bi ON bi.id = bp.budget_item_id
        WHERE bi.vendor_id = affected_vendor_id
        AND bp.status = 'paid'
      )
    WHERE id = affected_vendor_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Step 8: Create triggers
DROP TRIGGER IF EXISTS update_vendor_costs_on_budget_item_change ON budget_items;
CREATE TRIGGER update_vendor_costs_on_budget_item_change
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_costs_from_budget();

DROP TRIGGER IF EXISTS update_location_costs_on_budget_item_change ON budget_items;
CREATE TRIGGER update_location_costs_on_budget_item_change
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_location_costs_from_budget();

DROP TRIGGER IF EXISTS update_vendor_paid_amount_on_payment_change ON budget_payments;
CREATE TRIGGER update_vendor_paid_amount_on_payment_change
  AFTER INSERT OR UPDATE OR DELETE ON budget_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_paid_amount_from_payments();

-- Step 9: Initialize costs
UPDATE vendors v SET
  total_cost = (
    SELECT COALESCE(SUM(COALESCE(bi.actual_cost, bi.estimated_cost)), 0)
    FROM budget_items bi
    WHERE bi.vendor_id = v.id
  ),
  paid_amount = (
    SELECT COALESCE(SUM(bp.amount), 0)
    FROM budget_payments bp
    JOIN budget_items bi ON bi.id = bp.budget_item_id
    WHERE bi.vendor_id = v.id
    AND bp.status = 'paid'
  );

UPDATE locations l SET
  total_cost = (
    SELECT COALESCE(SUM(COALESCE(bi.actual_cost, bi.estimated_cost)), 0)
    FROM budget_items bi
    WHERE bi.location_id = l.id
  );
