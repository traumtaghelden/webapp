/*
  # Fix budget item deletion trigger
  
  1. Changes
    - Update log_budget_item_deletion function to set budget_item_id to NULL
    - This prevents foreign key violations when deleting items
  
  2. Security
    - Maintains audit trail of deletions
    - Prevents constraint violations
*/

-- Recreate the function with NULL budget_item_id for deletions
CREATE OR REPLACE FUNCTION log_budget_item_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO budget_history (
    wedding_id,
    budget_item_id,
    action,
    field_changed,
    old_value,
    new_value,
    changed_by
  ) VALUES (
    OLD.wedding_id,
    NULL,  -- Set to NULL to avoid foreign key constraint issues
    'deleted',
    'item_name',
    OLD.item_name,
    NULL,
    auth.uid()
  );
  
  RETURN OLD;
END;
$$;
