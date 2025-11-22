/*
  # Allow NULL budget_item_id in budget_history

  1. Changes
    - Drop and recreate the foreign key constraint to allow NULL values
    - This enables deletion tracking without referencing the deleted item
    - Foreign key constraints in PostgreSQL don't apply to NULL values by default,
      but we need to ensure the constraint is properly set up

  2. Security
    - Maintains referential integrity for non-NULL values
    - Allows audit trail of deletions with NULL budget_item_id
*/

-- Drop the existing foreign key constraint
ALTER TABLE budget_history 
DROP CONSTRAINT IF EXISTS budget_history_budget_item_id_fkey;

-- Recreate the constraint - it will automatically allow NULL values
-- because the column is nullable and foreign key constraints skip NULL values
ALTER TABLE budget_history
ADD CONSTRAINT budget_history_budget_item_id_fkey 
FOREIGN KEY (budget_item_id) 
REFERENCES budget_items(id) 
ON DELETE CASCADE;

-- Verify the column allows NULL
ALTER TABLE budget_history 
ALTER COLUMN budget_item_id DROP NOT NULL;
