/*
  # Fix Function Search Path Security

  1. Purpose
    - Fix role mutable search_path in functions
    - Set search_path explicitly to public for security
    - Prevents search_path manipulation attacks

  2. Functions Updated
    - update_location_updated_at
    - update_admin_support_notes_updated_at
    - update_updated_at_column
    - calculate_per_person_total
    - create_default_budget_categories
    - trigger_create_default_location_categories
    - trigger_create_default_vendor_categories
    - update_vendor_categories_updated_at
*/

-- Update functions with secure search_path using CREATE OR REPLACE

-- update_location_updated_at
CREATE OR REPLACE FUNCTION update_location_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- update_admin_support_notes_updated_at
CREATE OR REPLACE FUNCTION update_admin_support_notes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- calculate_per_person_total
CREATE OR REPLACE FUNCTION calculate_per_person_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NEW.calculation_mode = 'per_person' AND NEW.guest_count > 0 THEN
    NEW.total_amount = NEW.cost_per_person * NEW.guest_count;
  END IF;
  RETURN NEW;
END;
$$;

-- create_default_budget_categories
CREATE OR REPLACE FUNCTION create_default_budget_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO budget_categories (wedding_id, name, color) VALUES
    (NEW.id, 'Location', '#3B82F6'),
    (NEW.id, 'Catering', '#10B981'),
    (NEW.id, 'Photography', '#8B5CF6'),
    (NEW.id, 'Music', '#F59E0B'),
    (NEW.id, 'Flowers', '#EC4899'),
    (NEW.id, 'Clothing', '#6366F1'),
    (NEW.id, 'Rings', '#F97316'),
    (NEW.id, 'Invitations', '#14B8A6'),
    (NEW.id, 'Decorations', '#EF4444'),
    (NEW.id, 'Transportation', '#06B6D4'),
    (NEW.id, 'Accommodation', '#84CC16'),
    (NEW.id, 'Miscellaneous', '#6B7280');
  RETURN NEW;
END;
$$;

-- trigger_create_default_location_categories
CREATE OR REPLACE FUNCTION trigger_create_default_location_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO location_categories (wedding_id, name, icon, color) VALUES
    (NEW.id, 'Ceremony Locations', 'church', '#3B82F6'),
    (NEW.id, 'Reception Venues', 'utensils', '#10B981'),
    (NEW.id, 'Accommodation', 'hotel', '#8B5CF6'),
    (NEW.id, 'Other Locations', 'map-pin', '#6B7280');
  RETURN NEW;
END;
$$;

-- trigger_create_default_vendor_categories
CREATE OR REPLACE FUNCTION trigger_create_default_vendor_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO vendor_categories (wedding_id, name, icon, color) VALUES
    (NEW.id, 'Fotografie', 'camera', '#3B82F6'),
    (NEW.id, 'Videografie', 'video', '#10B981'),
    (NEW.id, 'Catering', 'utensils', '#F59E0B'),
    (NEW.id, 'Musik & DJ', 'music', '#8B5CF6'),
    (NEW.id, 'Floristik', 'flower-2', '#EC4899'),
    (NEW.id, 'Dekoration', 'palette', '#F97316'),
    (NEW.id, 'Bäckerei & Konditorei', 'cake', '#14B8A6'),
    (NEW.id, 'Transport', 'car', '#06B6D4'),
    (NEW.id, 'Unterhaltung', 'drama', '#EF4444'),
    (NEW.id, 'Sonstiges', 'briefcase', '#6B7280');
  RETURN NEW;
END;
$$;

-- update_vendor_categories_updated_at
CREATE OR REPLACE FUNCTION update_vendor_categories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;
