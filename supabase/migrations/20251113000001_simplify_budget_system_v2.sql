/*
  # Simplify Budget System - Remove Complexity (v2)

  ## Overview
  Simplified budget system without complex activity logging

  ## Changes
  - Simplify payment_status to 'planned' and 'paid'
  - Archive budget_partner_splits
  - Mark deprecated fields
*/

-- Disable triggers temporarily to avoid issues
ALTER TABLE budget_items DISABLE TRIGGER ALL;
ALTER TABLE budget_payments DISABLE TRIGGER ALL;

-- Migrate estimated_cost to actual_cost
UPDATE budget_items
SET actual_cost = GREATEST(actual_cost, estimated_cost)
WHERE estimated_cost > 0;

-- Simplify payment_status values
UPDATE budget_items
SET payment_status = 'planned'
WHERE payment_status IN ('partial', 'overdue', 'pending');

UPDATE budget_items
SET payment_status = 'paid'
WHERE paid = true;

-- Re-enable triggers
ALTER TABLE budget_items ENABLE TRIGGER ALL;
ALTER TABLE budget_payments ENABLE TRIGGER ALL;

-- Drop and recreate constraint
DO $$
BEGIN
  ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS budget_items_payment_status_check;
  ALTER TABLE budget_items ADD CONSTRAINT budget_items_payment_status_check
    CHECK (payment_status IN ('planned', 'paid'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Archive budget_partner_splits
CREATE TABLE IF NOT EXISTS budget_partner_splits_archive (
  id uuid PRIMARY KEY,
  budget_item_id uuid,
  partner_1_amount numeric,
  partner_2_amount numeric,
  split_type text,
  notes text,
  created_at timestamptz,
  archived_at timestamptz DEFAULT now()
);

INSERT INTO budget_partner_splits_archive
SELECT id, budget_item_id, partner_1_amount, partner_2_amount, split_type, notes, created_at, now()
FROM budget_partner_splits
ON CONFLICT DO NOTHING;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own budget partner splits" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can insert own budget partner splits" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can update own budget partner splits" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can delete own budget partner splits" ON budget_partner_splits;
DROP POLICY IF EXISTS "Premium users can manage partner splits" ON budget_partner_splits;

ALTER TABLE budget_partner_splits DISABLE ROW LEVEL SECURITY;

-- Simplify budget_payments
UPDATE budget_payments
SET status = 'planned'
WHERE status IN ('pending', 'overdue', 'cancelled');

DO $$
BEGIN
  ALTER TABLE budget_payments DROP CONSTRAINT IF EXISTS budget_payments_status_check;
  ALTER TABLE budget_payments ADD CONSTRAINT budget_payments_status_check
    CHECK (status IN ('planned', 'paid'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Drop overdue trigger
DROP TRIGGER IF EXISTS auto_update_overdue_payments_trigger ON budget_payments;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_budget_items_payment_status
  ON budget_items(payment_status) WHERE payment_status = 'planned';

CREATE INDEX IF NOT EXISTS idx_budget_items_paid
  ON budget_items(paid) WHERE paid = true;

-- Mark deprecated columns
COMMENT ON COLUMN budget_items.estimated_cost IS 'DEPRECATED: Use actual_cost';
COMMENT ON COLUMN budget_items.deposit_amount IS 'DEPRECATED';
COMMENT ON COLUMN budget_items.deposit_paid IS 'DEPRECATED';
COMMENT ON COLUMN budget_items.final_payment_due IS 'DEPRECATED';
