/*
  # Update Vendor Limit to 5 for Free Users

  1. Changes
    - Drop and recreate get_user_limits function with vendor limits
    - Update check_vendor_limit function to enforce max 5 vendors for free tier
    - Add RLS policy to prevent vendor creation when limit reached

  2. Limits
    - Free tier: Max 5 vendors
    - Premium tier: Unlimited vendors

  3. Security
    - Enforce limits at database level via RLS
    - Validate limits in functions
*/

-- Update check_vendor_limit function
CREATE OR REPLACE FUNCTION check_vendor_limit(p_user_id UUID, p_wedding_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_vendor_count INTEGER;
BEGIN
  -- Get subscription tier
  v_tier := get_user_subscription_tier(p_user_id);
  
  -- Premium users have no limits
  IF v_tier = 'premium' THEN
    RETURN TRUE;
  END IF;
  
  -- Count existing vendors for this wedding
  SELECT COUNT(*) INTO v_vendor_count
  FROM vendors
  WHERE wedding_id = p_wedding_id;
  
  -- Free tier: max 5 vendors
  RETURN v_vendor_count < 5;
END;
$$;

-- Drop existing get_user_limits function
DROP FUNCTION IF EXISTS get_user_limits(UUID, UUID);

-- Recreate get_user_limits function with vendor limits
CREATE OR REPLACE FUNCTION get_user_limits(p_user_id UUID, p_wedding_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_guest_count INTEGER;
  v_budget_items_count INTEGER;
  v_timeline_events_count INTEGER;
  v_timeline_buffers_count INTEGER;
  v_vendor_count INTEGER;
  v_result jsonb;
BEGIN
  -- Get subscription tier
  v_tier := get_user_subscription_tier(p_user_id);
  
  -- Count current usage
  SELECT COUNT(*) INTO v_guest_count FROM guests WHERE wedding_id = p_wedding_id;
  SELECT COUNT(*) INTO v_budget_items_count FROM budget_items WHERE wedding_id = p_wedding_id;
  SELECT COUNT(*) INTO v_timeline_events_count FROM wedding_timeline WHERE wedding_id = p_wedding_id AND event_type != 'buffer';
  SELECT COUNT(*) INTO v_timeline_buffers_count FROM wedding_timeline WHERE wedding_id = p_wedding_id AND event_type = 'buffer';
  SELECT COUNT(*) INTO v_vendor_count FROM vendors WHERE wedding_id = p_wedding_id;
  
  -- Build result based on tier
  IF v_tier = 'premium' THEN
    v_result := jsonb_build_object(
      'guests', jsonb_build_object('current', v_guest_count, 'max', NULL, 'can_add', true),
      'budget_items', jsonb_build_object('current', v_budget_items_count, 'max', NULL, 'can_add', true),
      'timeline_events', jsonb_build_object('current', v_timeline_events_count, 'max', NULL, 'can_add', true),
      'timeline_buffers', jsonb_build_object('current', v_timeline_buffers_count, 'max', NULL, 'can_add', true),
      'vendors', jsonb_build_object('current', v_vendor_count, 'max', NULL, 'can_add', true)
    );
  ELSE
    -- Free tier limits
    v_result := jsonb_build_object(
      'guests', jsonb_build_object('current', v_guest_count, 'max', 40, 'can_add', v_guest_count < 40),
      'budget_items', jsonb_build_object('current', v_budget_items_count, 'max', 15, 'can_add', v_budget_items_count < 15),
      'timeline_events', jsonb_build_object('current', v_timeline_events_count, 'max', 3, 'can_add', v_timeline_events_count < 3),
      'timeline_buffers', jsonb_build_object('current', v_timeline_buffers_count, 'max', 2, 'can_add', v_timeline_buffers_count < 2),
      'vendors', jsonb_build_object('current', v_vendor_count, 'max', 5, 'can_add', v_vendor_count < 5)
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Drop existing vendor limit enforcement policy if exists
DROP POLICY IF EXISTS "Enforce vendor limit on insert" ON vendors;

-- Add RLS policy to enforce vendor limit on INSERT
CREATE POLICY "Enforce vendor limit on insert"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user is premium or within free limit
    (
      SELECT get_user_subscription_tier(auth.uid()) = 'premium'
      OR check_vendor_limit(auth.uid(), wedding_id)
    )
  );
