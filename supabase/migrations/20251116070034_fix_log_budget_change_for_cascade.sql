/*
  # Fix log_budget_change Function for CASCADE Deletes

  1. Problem
    - log_budget_change() tries to insert wedding_id even when wedding is being deleted
    - This causes FK constraint violations during CASCADE deletes

  2. Solution
    - Check if wedding exists before logging
    - Skip logging if wedding doesn't exist (CASCADE delete scenario)
*/

CREATE OR REPLACE FUNCTION public.log_budget_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_wedding_exists BOOLEAN;
BEGIN
  -- Check if wedding still exists
  SELECT EXISTS(
    SELECT 1 FROM weddings 
    WHERE id = COALESCE(NEW.wedding_id, OLD.wedding_id)
  ) INTO v_wedding_exists;
  
  -- Only log if wedding still exists (not a CASCADE delete)
  IF v_wedding_exists THEN
    INSERT INTO public.budget_history (
      budget_item_id,
      field_changed,
      old_value,
      new_value,
      changed_by,
      wedding_id,
      action
    ) VALUES (
      CASE
        WHEN TG_OP = 'DELETE' THEN NULL
        ELSE COALESCE(NEW.id, OLD.id)
      END,
      TG_ARGV[0],
      COALESCE(OLD.item_name, ''),
      COALESCE(NEW.item_name, ''),
      auth.uid(),
      COALESCE(NEW.wedding_id, OLD.wedding_id),
      CASE
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN TG_OP = 'UPDATE' THEN 'updated'
        WHEN TG_OP = 'DELETE' THEN 'deleted'
        ELSE 'unknown'
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
