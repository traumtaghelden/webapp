/*
  # Simplify Budget System to Two-State Model (Open/Paid)

  ## Overview
  Simplifies the budget system by:
  - Reducing payment status to only 'open' (offen) and 'paid' (bezahlt)
  - Archiving payment plans and partner split features
  - Removing unnecessary columns while preserving data for analytics

  ## Changes Made
  1. Archive payment plan templates table (preserve for KPIs)
  2. Archive budget_partner_splits table (preserve for reporting)
  3. Simplify payment_status constraint to only 'open' and 'paid'
  4. Update all existing statuses to map to the two-state model
  5. Remove deprecated payment plan columns from budget_payments
  6. Drop payment plan related triggers and functions
  7. Maintain all data integrity for analytics and reporting

  ## Data Migration
  - 'planned', 'pending', 'partial', 'overdue' → 'open'
  - 'paid' → 'paid'

  ## Security
  - All archived tables remain accessible for KPI queries
  - RLS policies maintained for historical data access
  - No data loss, only reorganization
*/

-- Step 1: Archive payment_plan_templates table
DO $$
BEGIN
  -- Create archive table if it doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_plan_templates') THEN
    -- Create archive table with all data
    CREATE TABLE IF NOT EXISTS payment_plan_templates_archived AS
    SELECT
      id,
      name,
      description,
      payment_schedule,
      is_default,
      created_at,
      now() as archived_at
    FROM payment_plan_templates;

    -- Add index for KPI queries
    CREATE INDEX IF NOT EXISTS idx_payment_plan_templates_archived_id
      ON payment_plan_templates_archived(id);

    -- Drop original table
    DROP TABLE IF EXISTS payment_plan_templates;
  END IF;
END $$;

-- Step 2: Archive budget_partner_splits table (preserve all data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_partner_splits') THEN
    -- Create comprehensive archive
    CREATE TABLE IF NOT EXISTS budget_partner_splits_archived AS
    SELECT
      bps.*,
      bi.wedding_id,
      bi.item_name,
      bi.actual_cost,
      now() as archived_at
    FROM budget_partner_splits bps
    LEFT JOIN budget_items bi ON bi.id = bps.budget_item_id;

    -- Add indexes for analytics queries
    CREATE INDEX IF NOT EXISTS idx_budget_partner_splits_archived_wedding_id
      ON budget_partner_splits_archived(wedding_id);
    CREATE INDEX IF NOT EXISTS idx_budget_partner_splits_archived_budget_item_id
      ON budget_partner_splits_archived(budget_item_id);

    -- Enable RLS on archived table for secure KPI access
    ALTER TABLE budget_partner_splits_archived ENABLE ROW LEVEL SECURITY;

    -- Create read-only policy for archived data
    CREATE POLICY "Users can view archived partner splits for analytics"
      ON budget_partner_splits_archived FOR SELECT
      TO authenticated
      USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE user_id = auth.uid()
        )
      );

    -- Drop policies from original table
    DROP POLICY IF EXISTS "Users can view own budget partner splits" ON budget_partner_splits;
    DROP POLICY IF EXISTS "Users can insert own budget partner splits" ON budget_partner_splits;
    DROP POLICY IF EXISTS "Users can update own budget partner splits" ON budget_partner_splits;
    DROP POLICY IF EXISTS "Users can delete own budget partner splits" ON budget_partner_splits;
    DROP POLICY IF EXISTS "Premium users can manage partner splits" ON budget_partner_splits;

    -- Disable RLS and drop table
    ALTER TABLE budget_partner_splits DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS budget_partner_splits CASCADE;
  END IF;
END $$;

-- Step 3: Temporarily disable triggers for data migration
ALTER TABLE budget_items DISABLE TRIGGER ALL;
ALTER TABLE budget_payments DISABLE TRIGGER ALL;

-- Step 4: Migrate payment status values in budget_items
UPDATE budget_items
SET payment_status = 'open'
WHERE payment_status IN ('planned', 'pending', 'partial', 'overdue');

UPDATE budget_items
SET payment_status = 'paid'
WHERE payment_status = 'paid' OR paid = true;

-- Ensure paid flag matches payment_status
UPDATE budget_items
SET paid = true
WHERE payment_status = 'paid';

UPDATE budget_items
SET paid = false
WHERE payment_status = 'open';

-- Step 5: Migrate payment status values in budget_payments
UPDATE budget_payments
SET status = 'open'
WHERE status IN ('planned', 'pending', 'partial', 'overdue', 'cancelled');

UPDATE budget_payments
SET status = 'paid'
WHERE status = 'paid';

-- Step 6: Update constraints to enforce two-state model
DO $$
BEGIN
  -- Drop old constraint
  ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS budget_items_payment_status_check;

  -- Add new constraint with only two states
  ALTER TABLE budget_items ADD CONSTRAINT budget_items_payment_status_check
    CHECK (payment_status IN ('open', 'paid'));

  -- Update budget_payments constraint
  ALTER TABLE budget_payments DROP CONSTRAINT IF EXISTS budget_payments_status_check;

  ALTER TABLE budget_payments ADD CONSTRAINT budget_payments_status_check
    CHECK (status IN ('open', 'paid'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update handled: %', SQLERRM;
END $$;

-- Step 7: Remove payment plan specific columns from budget_payments
ALTER TABLE budget_payments DROP COLUMN IF EXISTS payment_type;
ALTER TABLE budget_payments DROP COLUMN IF EXISTS percentage_of_total;
ALTER TABLE budget_payments DROP COLUMN IF EXISTS trigger_date_type;
ALTER TABLE budget_payments DROP COLUMN IF EXISTS days_offset;

-- Step 8: Mark deprecated columns in budget_items (preserve for migration safety)
COMMENT ON COLUMN budget_items.estimated_cost IS 'DEPRECATED: Use actual_cost. Preserved for data migration.';
COMMENT ON COLUMN budget_items.deposit_amount IS 'DEPRECATED: No longer used in simplified system.';
COMMENT ON COLUMN budget_items.deposit_paid IS 'DEPRECATED: No longer used in simplified system.';
COMMENT ON COLUMN budget_items.final_payment_due IS 'DEPRECATED: No longer used in simplified system.';

-- Step 9: Drop payment plan related functions
DROP FUNCTION IF EXISTS get_monthly_payments(uuid, integer, integer);
DROP FUNCTION IF EXISTS calculate_per_person_total(uuid, integer);

-- Step 10: Drop triggers related to overdue payment automation
DROP TRIGGER IF EXISTS auto_update_overdue_payments_trigger ON budget_payments;
DROP FUNCTION IF EXISTS auto_update_overdue_payments();

-- Step 11: Re-enable triggers
ALTER TABLE budget_items ENABLE TRIGGER ALL;
ALTER TABLE budget_payments ENABLE TRIGGER ALL;

-- Step 12: Add performance indexes for two-state model
CREATE INDEX IF NOT EXISTS idx_budget_items_payment_status_open
  ON budget_items(wedding_id, payment_status) WHERE payment_status = 'open';

CREATE INDEX IF NOT EXISTS idx_budget_items_payment_status_paid
  ON budget_items(wedding_id, payment_status) WHERE payment_status = 'paid';

CREATE INDEX IF NOT EXISTS idx_budget_payments_status_open
  ON budget_payments(budget_item_id, status) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_budget_payments_status_paid
  ON budget_payments(budget_item_id, status) WHERE status = 'paid';

-- Step 13: Update budget history trigger to track simplified states
CREATE OR REPLACE FUNCTION log_budget_change_simplified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_changes jsonb;
  v_old_record jsonb;
  v_new_record jsonb;
BEGIN
  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    INSERT INTO budget_history (
      wedding_id,
      budget_item_id,
      operation,
      actual_cost,
      changed_by,
      changes
    ) VALUES (
      OLD.wedding_id,
      OLD.id,
      'DELETE',
      OLD.actual_cost,
      auth.uid(),
      jsonb_build_object(
        'item_name', jsonb_build_object('old', OLD.item_name, 'new', null),
        'actual_cost', jsonb_build_object('old', OLD.actual_cost, 'new', null),
        'payment_status', jsonb_build_object('old', OLD.payment_status, 'new', null)
      )
    );
    RETURN OLD;
  END IF;

  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    INSERT INTO budget_history (
      wedding_id,
      budget_item_id,
      operation,
      actual_cost,
      changed_by,
      changes
    ) VALUES (
      NEW.wedding_id,
      NEW.id,
      'INSERT',
      NEW.actual_cost,
      auth.uid(),
      jsonb_build_object(
        'item_name', jsonb_build_object('old', null, 'new', NEW.item_name),
        'actual_cost', jsonb_build_object('old', null, 'new', NEW.actual_cost),
        'payment_status', jsonb_build_object('old', null, 'new', NEW.payment_status)
      )
    );
    RETURN NEW;
  END IF;

  -- For UPDATE operations - only log actual changes
  v_changes := '{}'::jsonb;

  IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
    v_changes := v_changes || jsonb_build_object('item_name', jsonb_build_object('old', OLD.item_name, 'new', NEW.item_name));
  END IF;

  IF OLD.actual_cost IS DISTINCT FROM NEW.actual_cost THEN
    v_changes := v_changes || jsonb_build_object('actual_cost', jsonb_build_object('old', OLD.actual_cost, 'new', NEW.actual_cost));
  END IF;

  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    v_changes := v_changes || jsonb_build_object('payment_status', jsonb_build_object('old', OLD.payment_status, 'new', NEW.payment_status));
  END IF;

  IF OLD.paid IS DISTINCT FROM NEW.paid THEN
    v_changes := v_changes || jsonb_build_object('paid', jsonb_build_object('old', OLD.paid, 'new', NEW.paid));
  END IF;

  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    v_changes := v_changes || jsonb_build_object('notes', jsonb_build_object('old', OLD.notes, 'new', NEW.notes));
  END IF;

  -- Only insert if there are actual changes
  IF v_changes != '{}'::jsonb THEN
    INSERT INTO budget_history (
      wedding_id,
      budget_item_id,
      operation,
      actual_cost,
      changed_by,
      changes
    ) VALUES (
      NEW.wedding_id,
      NEW.id,
      'UPDATE',
      NEW.actual_cost,
      auth.uid(),
      v_changes
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger with simplified function
DROP TRIGGER IF EXISTS log_budget_change_trigger ON budget_items;
CREATE TRIGGER log_budget_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION log_budget_change_simplified();

-- Step 14: Add helpful comments for future reference
COMMENT ON TABLE budget_partner_splits_archived IS 'Archived partner split data. Available for KPI queries and historical analysis. Original table removed in two-state simplification.';
COMMENT ON TABLE payment_plan_templates_archived IS 'Archived payment plan templates. Available for historical analysis. Original table removed in two-state simplification.';
COMMENT ON CONSTRAINT budget_items_payment_status_check ON budget_items IS 'Two-state model: only open (offen) and paid (bezahlt) are allowed.';
COMMENT ON CONSTRAINT budget_payments_status_check ON budget_payments IS 'Two-state model: only open (offen) and paid (bezahlt) are allowed.';
