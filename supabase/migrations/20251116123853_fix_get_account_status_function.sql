/*
  # Fix get_account_status function

  1. Changes
    - Fix user_profiles lookup: use `user_id` column instead of `id`
    - Remove JOIN with non-existent stripe_customers table
    - Check stripe_subscriptions directly using stripe_customer_id from user_profiles
*/

CREATE OR REPLACE FUNCTION get_account_status(p_user_id uuid)
RETURNS account_status_type
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_status account_status_type;
  v_trial_ends_at timestamptz;
  v_stripe_customer_id text;
  v_has_active_subscription boolean;
BEGIN
  -- Get user profile data
  SELECT 
    account_status, 
    trial_ends_at,
    stripe_customer_id
  INTO 
    v_account_status, 
    v_trial_ends_at,
    v_stripe_customer_id
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Priority 1: Respect manually set premium_active status (admin override)
  IF v_account_status = 'premium_active' THEN
    RETURN 'premium_active'::account_status_type;
  END IF;

  -- Priority 2: Check for active Stripe subscription
  IF v_stripe_customer_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 
      FROM stripe_subscriptions
      WHERE customer_id = v_stripe_customer_id
        AND status = 'active'
    ) INTO v_has_active_subscription;

    IF v_has_active_subscription THEN
      RETURN 'premium_active'::account_status_type;
    END IF;
  END IF;

  -- Priority 3: Check trial period
  IF v_trial_ends_at > now() THEN
    RETURN 'trial_active'::account_status_type;
  END IF;

  -- Priority 4: Return stored status
  RETURN v_account_status;
END;
$$;