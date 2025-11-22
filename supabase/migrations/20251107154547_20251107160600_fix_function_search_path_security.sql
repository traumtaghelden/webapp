/*
  # Fix Function Search Path Security Issues

  1. Changes Made
    - Add SECURITY DEFINER and SET search_path to all functions that had role mutable search_path warnings
    - This prevents potential security vulnerabilities from search_path hijacking
    - Drop and recreate triggers where necessary

  2. Security
    - All functions now have fixed search_path
    - Prevents malicious code execution via search_path manipulation
*/

-- ============================================================================
-- FIX VENDOR PAYMENTS FUNCTION
-- ============================================================================

DROP TRIGGER IF EXISTS set_vendor_payments_updated_at ON vendor_payments;
DROP FUNCTION IF EXISTS update_vendor_payments_updated_at() CASCADE;

CREATE FUNCTION update_vendor_payments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_vendor_payments_updated_at
  BEFORE UPDATE ON vendor_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_payments_updated_at();

-- ============================================================================
-- FIX FAMILY GROUPS FUNCTION
-- ============================================================================

DROP TRIGGER IF EXISTS set_family_groups_updated_at ON family_groups;
DROP FUNCTION IF EXISTS update_family_groups_updated_at() CASCADE;

CREATE FUNCTION update_family_groups_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_family_groups_updated_at
  BEFORE UPDATE ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_family_groups_updated_at();

-- ============================================================================
-- FIX TIMELINE EVENT GUEST ATTENDANCE FUNCTION
-- ============================================================================

DROP TRIGGER IF EXISTS set_timeline_event_guest_attendance_updated_at ON timeline_event_guest_attendance;
DROP FUNCTION IF EXISTS update_timeline_event_guest_attendance_updated_at() CASCADE;

CREATE FUNCTION update_timeline_event_guest_attendance_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_timeline_event_guest_attendance_updated_at
  BEFORE UPDATE ON timeline_event_guest_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_timeline_event_guest_attendance_updated_at();

-- ============================================================================
-- FIX CREATE ATTENDANCE FOR NEW EVENT FUNCTION
-- ============================================================================

DROP TRIGGER IF EXISTS create_attendance_for_new_event_trigger ON wedding_timeline;
DROP FUNCTION IF EXISTS create_attendance_for_new_event() CASCADE;

CREATE FUNCTION create_attendance_for_new_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO timeline_event_guest_attendance (timeline_event_id, guest_id, is_attending)
  SELECT NEW.id, g.id, true
  FROM guests g
  WHERE g.wedding_id = NEW.wedding_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_attendance_for_new_event_trigger
  AFTER INSERT ON wedding_timeline
  FOR EACH ROW
  EXECUTE FUNCTION create_attendance_for_new_event();

-- ============================================================================
-- FIX CREATE ATTENDANCE FOR NEW GUEST FUNCTION
-- ============================================================================

DROP TRIGGER IF EXISTS create_attendance_for_new_guest_trigger ON guests;
DROP FUNCTION IF EXISTS create_attendance_for_new_guest() CASCADE;

CREATE FUNCTION create_attendance_for_new_guest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO timeline_event_guest_attendance (timeline_event_id, guest_id, is_attending)
  SELECT wt.id, NEW.id, true
  FROM wedding_timeline wt
  WHERE wt.wedding_id = NEW.wedding_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_attendance_for_new_guest_trigger
  AFTER INSERT ON guests
  FOR EACH ROW
  EXECUTE FUNCTION create_attendance_for_new_guest();

-- ============================================================================
-- FIX MAP VENDOR CATEGORY TO BUDGET FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS map_vendor_category_to_budget(text) CASCADE;

CREATE FUNCTION map_vendor_category_to_budget(vendor_cat text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
IMMUTABLE
AS $$
BEGIN
  RETURN CASE vendor_cat
    WHEN 'venue' THEN 'Location'
    WHEN 'catering' THEN 'Catering'
    WHEN 'photography' THEN 'Photography & Videography'
    WHEN 'videography' THEN 'Photography & Videography'
    WHEN 'florist' THEN 'Flowers & Decoration'
    WHEN 'music' THEN 'Music & Entertainment'
    WHEN 'entertainment' THEN 'Music & Entertainment'
    WHEN 'decoration' THEN 'Flowers & Decoration'
    ELSE 'Other'
  END;
END;
$$;

-- ============================================================================
-- FIX SYNC OPERATION FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS is_in_sync_operation() CASCADE;

CREATE FUNCTION is_in_sync_operation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN COALESCE(current_setting('app.in_sync_operation', true)::boolean, false);
END;
$$;

DROP FUNCTION IF EXISTS set_sync_flag(boolean) CASCADE;

CREATE FUNCTION set_sync_flag(flag boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.in_sync_operation', flag::text, true);
END;
$$;

-- ============================================================================
-- FIX VENDOR EVENT ASSIGNMENTS FUNCTION
-- ============================================================================

DROP TRIGGER IF EXISTS set_vendor_event_assignments_updated_at ON vendor_event_assignments;
DROP FUNCTION IF EXISTS update_vendor_event_assignments_updated_at() CASCADE;

CREATE FUNCTION update_vendor_event_assignments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_vendor_event_assignments_updated_at
  BEFORE UPDATE ON vendor_event_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_event_assignments_updated_at();

-- ============================================================================
-- FIX CALCULATE PER PERSON TOTAL FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS calculate_per_person_total(uuid) CASCADE;

CREATE FUNCTION calculate_per_person_total(w_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  total numeric;
  guest_count integer;
BEGIN
  SELECT COALESCE(SUM(cost_per_person), 0)
  INTO total
  FROM budget_items
  WHERE wedding_id = w_id
    AND is_per_person = true;
  
  SELECT COUNT(*)
  INTO guest_count
  FROM guests
  WHERE wedding_id = w_id;
  
  RETURN total * COALESCE(guest_count, 0);
END;
$$;

-- ============================================================================
-- FIX GET MONTHLY PAYMENTS FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_monthly_payments(uuid) CASCADE;

CREATE FUNCTION get_monthly_payments(w_id uuid)
RETURNS TABLE (
  month date,
  total_amount numeric,
  payment_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('month', bp.payment_date)::date as month,
    SUM(bp.amount) as total_amount,
    COUNT(*)::bigint as payment_count
  FROM budget_payments bp
  JOIN budget_items bi ON bi.id = bp.budget_item_id
  WHERE bi.wedding_id = w_id
    AND bp.payment_date IS NOT NULL
  GROUP BY date_trunc('month', bp.payment_date)
  ORDER BY month;
END;
$$;

-- ============================================================================
-- FIX CREATE DEFAULT BUDGET CATEGORIES FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS create_default_budget_categories(uuid) CASCADE;

CREATE FUNCTION create_default_budget_categories(w_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO budget_categories (wedding_id, name, color)
  VALUES
    (w_id, 'Location', '#3B82F6'),
    (w_id, 'Catering', '#10B981'),
    (w_id, 'Photography & Videography', '#F59E0B'),
    (w_id, 'Flowers & Decoration', '#EC4899'),
    (w_id, 'Music & Entertainment', '#8B5CF6'),
    (w_id, 'Attire', '#EF4444'),
    (w_id, 'Invitations & Stationery', '#6366F1'),
    (w_id, 'Transportation', '#14B8A6'),
    (w_id, 'Other', '#6B7280')
  ON CONFLICT DO NOTHING;
END;
$$;