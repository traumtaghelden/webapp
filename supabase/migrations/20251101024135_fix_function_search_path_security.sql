/*
  # Fix Function Search Path Security Issues

  ## Purpose
  Addresses security vulnerabilities in database functions by:
  - Setting explicit search_path to prevent SQL injection
  - Using SECURITY INVOKER where appropriate
  - Adding explicit schema qualification

  ## Functions Fixed
  - update_updated_at_column
  - log_budget_change
  - get_confirmed_guests_count
  - calculate_per_person_total
  - get_monthly_payments
  - update_budget_item_costs
  - create_default_budget_categories
  - update_overdue_payments
  - check_payment_overdue

  ## Security Impact
  Prevents search_path manipulation attacks that could lead to:
  - Privilege escalation
  - Data exfiltration
  - SQL injection
*/

-- Drop and recreate functions with security fixes

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_budget_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
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
    COALESCE(NEW.id, OLD.id),
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
$$;

CREATE OR REPLACE FUNCTION public.get_confirmed_guests_count(p_wedding_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM public.guests
  WHERE wedding_id = p_wedding_id
  AND rsvp_status = 'confirmed';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_per_person_total(p_wedding_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_total numeric;
  v_guest_count integer;
BEGIN
  SELECT COALESCE(SUM(estimated_cost), 0) INTO v_total
  FROM public.budget_items
  WHERE wedding_id = p_wedding_id
  AND is_per_person = true;
  
  SELECT public.get_confirmed_guests_count(p_wedding_id) INTO v_guest_count;
  
  IF v_guest_count > 0 THEN
    RETURN v_total / v_guest_count;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_monthly_payments(p_wedding_id uuid)
RETURNS TABLE (
  month date,
  total_due numeric,
  total_paid numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('month', bp.due_date)::date as month,
    SUM(bp.amount) as total_due,
    SUM(CASE WHEN bp.status = 'paid' THEN bp.amount ELSE 0 END) as total_paid
  FROM public.budget_payments bp
  JOIN public.budget_items bi ON bi.id = bp.budget_item_id
  WHERE bi.wedding_id = p_wedding_id
  GROUP BY date_trunc('month', bp.due_date)
  ORDER BY month;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_budget_item_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_guest_count integer;
BEGIN
  IF NEW.is_per_person = true THEN
    SELECT public.get_confirmed_guests_count(NEW.wedding_id) INTO v_guest_count;
    
    IF NEW.use_confirmed_guests_only THEN
      NEW.actual_cost = NEW.cost_per_person * v_guest_count;
    ELSIF NEW.guest_count_override IS NOT NULL THEN
      NEW.actual_cost = NEW.cost_per_person * NEW.guest_count_override;
    ELSE
      NEW.actual_cost = NEW.cost_per_person * v_guest_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_budget_categories(p_wedding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.budget_categories (wedding_id, name, color, icon, display_order, is_default)
  VALUES
    (p_wedding_id, 'Venue', '#3B82F6', 'MapPin', 1, true),
    (p_wedding_id, 'Catering', '#10B981', 'UtensilsCrossed', 2, true),
    (p_wedding_id, 'Photography', '#8B5CF6', 'Camera', 3, true),
    (p_wedding_id, 'Music & Entertainment', '#EC4899', 'Music', 4, true),
    (p_wedding_id, 'Flowers & Decoration', '#F59E0B', 'Flower', 5, true),
    (p_wedding_id, 'Attire', '#6366F1', 'Shirt', 6, true),
    (p_wedding_id, 'Invitations', '#14B8A6', 'Mail', 7, true),
    (p_wedding_id, 'Transportation', '#F97316', 'Car', 8, true),
    (p_wedding_id, 'Other', '#6B7280', 'MoreHorizontal', 9, true)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_overdue_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.budget_payments
  SET is_overdue = true
  WHERE status IN ('pending', 'partial')
  AND due_date < CURRENT_DATE
  AND (is_overdue IS NULL OR is_overdue = false);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_payment_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IN ('pending', 'partial') AND NEW.due_date < CURRENT_DATE THEN
    NEW.is_overdue = true;
  ELSIF NEW.status = 'paid' THEN
    NEW.is_overdue = false;
  ELSE
    NEW.is_overdue = COALESCE(NEW.is_overdue, false);
  END IF;
  
  RETURN NEW;
END;
$$;