/*
  # Fix log_budget_change function for DELETE operations

  1. Changes
    - Update log_budget_change to use NULL for budget_item_id on DELETE
    - This prevents foreign key constraint violations when deleting items
    - Maintains audit trail without referencing deleted items

  2. Security
    - Maintains SECURITY DEFINER for proper execution
    - Preserves all existing functionality for INSERT and UPDATE
*/

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
    COALESCE((SELECT auth.uid()), '00000000-0000-0000-0000-000000000000'::uuid),
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
