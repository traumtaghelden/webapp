/*
  # Fix log_vendor_changes trigger

  ## Problem
  The trigger references NEW.vendor_name and OLD.vendor_name, but the 
  vendors table has a column called 'name', not 'vendor_name'.

  ## Changes
  - Replace all occurrences of vendor_name with name in the trigger function

  ## Security
  - No RLS changes needed
*/

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
    
    -- Vendor is being deleted, but wedding exists
    v_changes := jsonb_build_object(
      'vendor_id', OLD.id,
      'vendor_name', OLD.name,
      'wedding_id', OLD.wedding_id,
      'vendor', row_to_json(OLD)
    );
    v_description := 'Vendor ' || OLD.name || ' deleted';
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (OLD.id, auth.uid(), 'deleted', v_changes, v_description);
    
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'vendor_id', NEW.id,
      'vendor_name', NEW.name,
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
    v_description := 'Vendor ' || NEW.name || ' updated';
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (NEW.id, auth.uid(), 'updated', v_changes, v_description);
    
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'vendor_id', NEW.id,
      'vendor_name', NEW.name,
      'vendor', row_to_json(NEW)
    );
    v_description := 'Vendor ' || NEW.name || ' created';
    
    INSERT INTO vendor_activity_log (vendor_id, user_id, action_type, changes, description)
    VALUES (NEW.id, auth.uid(), 'created', v_changes, v_description);
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;