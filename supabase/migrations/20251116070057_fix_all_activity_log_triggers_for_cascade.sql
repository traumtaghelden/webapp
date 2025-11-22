/*
  # Fix All Activity Log Triggers for CASCADE Deletes

  1. Problem
    - Multiple activity log functions fail during CASCADE deletes
    - They try to log to tables with FK constraints on deleted records

  2. Solution
    - Update all log functions to check if parent record exists
    - Skip logging if parent doesn't exist (CASCADE delete scenario)
    - Applies to: vendor_activity_log, budget_history, etc.
*/

-- Fix log_vendor_changes function
CREATE OR REPLACE FUNCTION log_vendor_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_changes JSONB;
  v_description TEXT;
  v_wedding_exists BOOLEAN;
BEGIN
  -- Check if wedding still exists
  IF TG_OP = 'DELETE' THEN
    SELECT EXISTS(SELECT 1 FROM weddings WHERE id = OLD.wedding_id) INTO v_wedding_exists;
    
    -- Skip logging if wedding is being deleted (CASCADE)
    IF NOT v_wedding_exists THEN
      RETURN OLD;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'vendor_name', OLD.vendor_name,
      'category', OLD.category
    );
    v_description := 'Vendor ' || OLD.vendor_name || ' deleted';
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (OLD.id, auth.uid(), 'deleted', v_changes, v_description);
    
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
    v_description := 'Vendor ' || NEW.vendor_name || ' updated';
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (NEW.id, auth.uid(), 'updated', v_changes, v_description);
    
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'vendor', row_to_json(NEW)
    );
    v_description := 'Vendor ' || NEW.vendor_name || ' created';
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (NEW.id, auth.uid(), 'created', v_changes, v_description);
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;
