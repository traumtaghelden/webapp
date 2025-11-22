/*
  # Fix Account Status Priority

  1. Changes
    - Update get_account_status to respect manually set premium_active status
    - Priority: manual premium_active > stripe subscription > trial_ends_at
    
  2. Notes
    - Fixes issue where admin-activated premium users still see trial status
    - Respects manual admin overrides
*/

CREATE OR REPLACE FUNCTION get_account_status(p_user_id uuid)
RETURNS account_status_type
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_account_status account_status_type;
  v_trial_ends_at timestamptz;
  v_has_active_subscription boolean;
BEGIN
  SELECT account_status, trial_ends_at
  INTO v_account_status, v_trial_ends_at
  FROM user_profiles
  WHERE id = p_user_id;

  -- Priority 1: Respect manually set premium_active status (admin override)
  IF v_account_status = 'premium_active' THEN
    RETURN 'premium_active'::account_status_type;
  END IF;

  -- Priority 2: Check for active Stripe subscription
  SELECT EXISTS (
    SELECT 1 FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON sc.customer_id = ss.customer_id
    WHERE sc.user_id = p_user_id
    AND ss.status = 'active'
  ) INTO v_has_active_subscription;

  IF v_has_active_subscription THEN
    RETURN 'premium_active'::account_status_type;
  END IF;

  -- Priority 3: Check trial period
  IF v_trial_ends_at > now() THEN
    RETURN 'trial_active'::account_status_type;
  END IF;

  -- Priority 4: Return stored status
  RETURN v_account_status;
END;
$$;

COMMENT ON FUNCTION get_account_status IS 'Get computed account status - respects manual admin overrides first';
