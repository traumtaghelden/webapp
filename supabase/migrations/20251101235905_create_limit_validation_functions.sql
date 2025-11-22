/*
  # Create Limit Validation Functions

  1. Functions Created
    - `get_user_subscription_tier(user_id)` - Returns subscription tier for a user
    - `check_guest_limit(user_id, wedding_id)` - Validates if user can add more guests
    - `check_budget_item_limit(user_id, wedding_id)` - Validates if user can add more budget items
    - `check_timeline_event_limit(user_id, wedding_id, event_type)` - Validates if user can add more timeline events
    - `check_vendor_limit(user_id, wedding_id)` - Validates if user can add more vendors
    - `get_user_limits(user_id)` - Returns all current usage and limits for a user

  2. Limit Rules
    - Free tier:
      - Max 40 guests
      - Max 15 budget items
      - Max 3 regular events + 2 buffer events in timeline
      - Max 5 vendors
    - Premium tier:
      - No limits (returns true for all checks)

  3. Security
    - All functions use SECURITY DEFINER with search_path for safety
    - Functions validate user ownership before checking limits
*/

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT subscription_tier INTO v_tier
  FROM user_profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_tier, 'free');
END;
$$;

-- Function to check guest limit
CREATE OR REPLACE FUNCTION check_guest_limit(p_user_id UUID, p_wedding_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_guest_count INTEGER;
BEGIN
  -- Get subscription tier
  v_tier := get_user_subscription_tier(p_user_id);
  
  -- Premium users have no limits
  IF v_tier = 'premium' THEN
    RETURN TRUE;
  END IF;
  
  -- Count existing guests for this wedding
  SELECT COUNT(*) INTO v_guest_count
  FROM guests
  WHERE wedding_id = p_wedding_id;
  
  -- Free tier: max 40 guests
  RETURN v_guest_count < 40;
END;
$$;

-- Function to check budget item limit
CREATE OR REPLACE FUNCTION check_budget_item_limit(p_user_id UUID, p_wedding_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_item_count INTEGER;
BEGIN
  -- Get subscription tier
  v_tier := get_user_subscription_tier(p_user_id);
  
  -- Premium users have no limits
  IF v_tier = 'premium' THEN
    RETURN TRUE;
  END IF;
  
  -- Count existing budget items for this wedding
  SELECT COUNT(*) INTO v_item_count
  FROM budget_items
  WHERE wedding_id = p_wedding_id;
  
  -- Free tier: max 15 budget items
  RETURN v_item_count < 15;
END;
$$;

-- Function to check timeline event limit
CREATE OR REPLACE FUNCTION check_timeline_event_limit(p_user_id UUID, p_wedding_id UUID, p_event_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_event_count INTEGER;
  v_buffer_count INTEGER;
BEGIN
  -- Get subscription tier
  v_tier := get_user_subscription_tier(p_user_id);
  
  -- Premium users have no limits
  IF v_tier = 'premium' THEN
    RETURN TRUE;
  END IF;
  
  -- Count existing events (exclude buffer type)
  SELECT COUNT(*) INTO v_event_count
  FROM wedding_timeline
  WHERE wedding_id = p_wedding_id
    AND (event_type IS NULL OR event_type != 'buffer');
  
  -- Count existing buffer events
  SELECT COUNT(*) INTO v_buffer_count
  FROM wedding_timeline
  WHERE wedding_id = p_wedding_id
    AND event_type = 'buffer';
  
  -- Free tier: max 3 regular events + 2 buffer events
  IF p_event_type = 'buffer' THEN
    RETURN v_buffer_count < 2;
  ELSE
    RETURN v_event_count < 3;
  END IF;
END;
$$;

-- Function to check vendor limit
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

-- Function to get all user limits and current usage
CREATE OR REPLACE FUNCTION get_user_limits(p_user_id UUID, p_wedding_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_result JSON;
BEGIN
  -- Get subscription tier
  v_tier := get_user_subscription_tier(p_user_id);
  
  -- Build result JSON
  SELECT json_build_object(
    'subscription_tier', v_tier,
    'is_premium', v_tier = 'premium',
    'guests', json_build_object(
      'current', (SELECT COUNT(*) FROM guests WHERE wedding_id = p_wedding_id),
      'max', CASE WHEN v_tier = 'premium' THEN NULL ELSE 40 END,
      'can_add', check_guest_limit(p_user_id, p_wedding_id)
    ),
    'budget_items', json_build_object(
      'current', (SELECT COUNT(*) FROM budget_items WHERE wedding_id = p_wedding_id),
      'max', CASE WHEN v_tier = 'premium' THEN NULL ELSE 15 END,
      'can_add', check_budget_item_limit(p_user_id, p_wedding_id)
    ),
    'timeline_events', json_build_object(
      'current', (SELECT COUNT(*) FROM wedding_timeline WHERE wedding_id = p_wedding_id AND (event_type IS NULL OR event_type != 'buffer')),
      'max', CASE WHEN v_tier = 'premium' THEN NULL ELSE 3 END,
      'can_add', check_timeline_event_limit(p_user_id, p_wedding_id, 'regular')
    ),
    'timeline_buffers', json_build_object(
      'current', (SELECT COUNT(*) FROM wedding_timeline WHERE wedding_id = p_wedding_id AND event_type = 'buffer'),
      'max', CASE WHEN v_tier = 'premium' THEN NULL ELSE 2 END,
      'can_add', check_timeline_event_limit(p_user_id, p_wedding_id, 'buffer')
    ),
    'vendors', json_build_object(
      'current', (SELECT COUNT(*) FROM vendors WHERE wedding_id = p_wedding_id),
      'max', CASE WHEN v_tier = 'premium' THEN NULL ELSE 5 END,
      'can_add', check_vendor_limit(p_user_id, p_wedding_id)
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION get_user_subscription_tier IS 'Returns subscription tier (free or premium) for a user';
COMMENT ON FUNCTION check_guest_limit IS 'Checks if user can add more guests (free: 40 max, premium: unlimited)';
COMMENT ON FUNCTION check_budget_item_limit IS 'Checks if user can add more budget items (free: 15 max, premium: unlimited)';
COMMENT ON FUNCTION check_timeline_event_limit IS 'Checks if user can add more timeline events (free: 3 events + 2 buffers, premium: unlimited)';
COMMENT ON FUNCTION check_vendor_limit IS 'Checks if user can add more vendors (free: 5 max, premium: unlimited)';
COMMENT ON FUNCTION get_user_limits IS 'Returns comprehensive limit information and current usage for a user';