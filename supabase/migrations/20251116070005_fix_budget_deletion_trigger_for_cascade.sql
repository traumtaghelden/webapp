/*
  # Fix Budget Item Deletion Trigger for CASCADE Deletes

  1. Problem
    - When a wedding is deleted, CASCADE deletes budget_items
    - log_budget_item_deletion() tries to insert into budget_history with deleted wedding_id
    - This violates foreign key constraint

  2. Solution
    - Check if wedding still exists before logging
    - Skip logging if wedding doesn't exist (CASCADE delete scenario)
    - This allows clean wedding deletion
*/

CREATE OR REPLACE FUNCTION log_budget_item_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wedding_exists BOOLEAN;
BEGIN
  -- Check if wedding still exists
  SELECT EXISTS(SELECT 1 FROM weddings WHERE id = OLD.wedding_id) INTO v_wedding_exists;
  
  -- Only log if wedding still exists (not a CASCADE delete)
  IF v_wedding_exists THEN
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
      NULL,
      'deleted',
      'item_name',
      OLD.item_name,
      NULL,
      auth.uid()
    );
  END IF;
  
  RETURN OLD;
END;
$$;
