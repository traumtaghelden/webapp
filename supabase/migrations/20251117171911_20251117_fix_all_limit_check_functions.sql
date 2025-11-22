/*
  # Fix all limit check functions for new premium system
  
  1. Updates
    - Remove references to non-existent subscription_tier column
    - All users have unlimited access (premium-only system)
    - Update check_budget_item_limit
    - Update check_guest_limit
    - Update check_timeline_event_limit
    - Update check_vendor_limit
*/

-- Fix check_budget_item_limit
CREATE OR REPLACE FUNCTION check_budget_item_limit(p_wedding_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- All users have unlimited budget items in premium-only system
  RETURN true;
END;
$$;

-- Fix check_guest_limit
CREATE OR REPLACE FUNCTION check_guest_limit(p_wedding_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- All users have unlimited guests in premium-only system
  RETURN true;
END;
$$;

-- Fix check_timeline_event_limit
CREATE OR REPLACE FUNCTION check_timeline_event_limit(p_wedding_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- All users have unlimited timeline events in premium-only system
  RETURN true;
END;
$$;

-- Fix check_vendor_limit
CREATE OR REPLACE FUNCTION check_vendor_limit(p_wedding_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- All users have unlimited vendors in premium-only system
  RETURN true;
END;
$$;