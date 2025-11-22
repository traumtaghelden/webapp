/*
  # Fix Account Status Mapping for Frontend

  1. Changes
    - Update `check_trial_status()` function to map new account_status values to frontend-expected values
    - Add subscription details (next payment date, subscription status)
    - Map status values:
      - `premium_active` → `paid_active`
      - `premium_cancelled` → `subscription_cancelled`
      - `trial_active` → `trial_active`
      - `trial_ended` → `trial_ended`
  
  2. New Fields
    - `premiumSince` - When premium was activated
    - `nextPaymentDate` - Next subscription payment date
    - `subscriptionStatus` - Current Stripe subscription status
*/

CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_account_status account_status_type;
  v_trial_ends_at timestamptz;
  v_deletion_scheduled_at timestamptz;
  v_premium_since timestamptz;
  v_has_access boolean;
  v_is_read_only boolean;
  v_days_remaining integer;
  v_frontend_status text;
  v_next_payment_date timestamptz;
  v_subscription_status text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Not authenticated',
      'accountStatus', null,
      'hasAccess', false,
      'isReadOnly', true
    );
  END IF;

  -- Get account info
  SELECT
    account_status,
    trial_ends_at,
    data_deletion_scheduled_at,
    premium_since
  INTO
    v_account_status,
    v_trial_ends_at,
    v_deletion_scheduled_at,
    v_premium_since
  FROM user_profiles
  WHERE user_id = v_user_id;

  -- Get real-time status
  v_account_status := get_account_status(v_user_id);
  v_is_read_only := is_read_only_mode(v_user_id);
  v_has_access := NOT v_is_read_only;

  -- Get subscription details if premium
  IF v_account_status IN ('premium_active', 'premium_cancelled') THEN
    SELECT 
      current_period_end,
      status
    INTO 
      v_next_payment_date,
      v_subscription_status
    FROM stripe_subscriptions
    WHERE user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Map new status values to frontend-expected values
  CASE v_account_status
    WHEN 'premium_active' THEN
      v_frontend_status := 'paid_active';
    WHEN 'trial_active' THEN
      v_frontend_status := 'trial_active';
    WHEN 'trial_ended' THEN
      v_frontend_status := 'trial_ended';
    WHEN 'premium_cancelled' THEN
      v_frontend_status := 'subscription_cancelled';
    WHEN 'grace_period' THEN
      v_frontend_status := 'trial_ended';
    WHEN 'pending_deletion' THEN
      v_frontend_status := 'trial_ended';
    ELSE
      v_frontend_status := 'trial_ended';
  END CASE;

  -- Calculate days remaining in trial
  IF v_account_status = 'trial_active' THEN
    v_days_remaining := GREATEST(0, EXTRACT(DAY FROM (v_trial_ends_at - now()))::integer);
  ELSE
    v_days_remaining := 0;
  END IF;

  RETURN jsonb_build_object(
    'accountStatus', v_frontend_status,
    'hasAccess', v_has_access,
    'isReadOnly', v_is_read_only,
    'daysRemaining', v_days_remaining,
    'trialEndsAt', v_trial_ends_at,
    'deletionScheduledAt', v_deletion_scheduled_at,
    'premiumSince', v_premium_since,
    'nextPaymentDate', v_next_payment_date,
    'subscriptionStatus', v_subscription_status
  );
END;
$$;
