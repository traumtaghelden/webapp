/*
  # Fix all budget deletion triggers
  
  1. Changes
    - Update log_budget_change function to use NULL for budget_item_id on DELETE
    - Ensures no foreign key violations during deletion
  
  2. Security
    - Maintains audit trail
    - Prevents constraint violations
*/

-- Fix the log_budget_change function
CREATE OR REPLACE FUNCTION log_budget_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, new_value, changed_by)
    VALUES (NEW.wedding_id, NEW.id, 'created', 'item_created', NEW.item_name, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.actual_cost != NEW.actual_cost THEN
      INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.wedding_id, NEW.id, 'updated', 'actual_cost', OLD.actual_cost::text, NEW.actual_cost::text, auth.uid());
    END IF;
    IF OLD.paid != NEW.paid THEN
      INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.wedding_id, NEW.id, 'payment_status_changed', 'paid', OLD.paid::text, NEW.paid::text, auth.uid());
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Use NULL for budget_item_id to avoid foreign key constraint violations
    INSERT INTO budget_history (wedding_id, budget_item_id, action, field_changed, old_value, changed_by)
    VALUES (OLD.wedding_id, NULL, 'deleted', 'item_deleted', OLD.item_name, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
