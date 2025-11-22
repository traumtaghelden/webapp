/*
  # Fix log_budget_change function to handle NULL auth.uid()

  ## Changes
  - Allow NULL for changed_by when no authenticated user (system operations)
  - This fixes migration issues where system updates trigger the history log
*/

-- First, alter the budget_history table to allow NULL for changed_by
ALTER TABLE budget_history ALTER COLUMN changed_by DROP NOT NULL;

-- Then update the function to use NULL instead of fake UUID
CREATE OR REPLACE FUNCTION public.log_budget_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.budget_history (
    budget_item_id,
    field_changed,
    old_value,
    new_value,
    changed_by,
    wedding_id,
    action
  ) VALUES (
    -- Use NULL for DELETE operations to avoid foreign key violations
    CASE
      WHEN TG_OP = 'DELETE' THEN NULL
      ELSE COALESCE(NEW.id, OLD.id)
    END,
    TG_ARGV[0],
    COALESCE(OLD.item_name, ''),
    COALESCE(NEW.item_name, ''),
    auth.uid(),  -- Can be NULL for system operations
    COALESCE(NEW.wedding_id, OLD.wedding_id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
      ELSE 'unknown'
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;
