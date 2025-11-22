/*
  # Fix check_trial_status to use correct 'id' column

  1. Changes
    - Fix `check_trial_status`: use `id` instead of `user_id` in WHERE clause
  
  2. Impact
    - check_trial_status will finally work
    - Settings → Abo Tab will show status
*/

CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_account_status account_status_type;
  v_trial_ends_at timestamptz;
  v_deletion_scheduled_at timestamptz;
  v_premium_since timestamptz;
  v_stripe_customer_id text;
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

  -- Get account info (FIXED: use 'id' instead of 'user_id')
  SELECT
    account_status,
    trial_ends_at,
    data_deletion_scheduled_at,
    premium_since,
    stripe_customer_id
  INTO
    v_account_status,
    v_trial_ends_at,
    v_deletion_scheduled_at,
    v_premium_since,
    v_stripe_customer_id
  FROM user_profiles
  WHERE id = v_user_id;  -- FIXED: was 'user_id', now 'id'

  -- Get real-time status
  v_account_status := get_account_status(v_user_id);
  v_is_read_only := is_read_only_mode(v_user_id);
  v_has_access := NOT v_is_read_only;

  -- Get subscription details if premium and customer_id exists
  IF v_account_status IN ('premium_active', 'premium_cancelled') AND v_stripe_customer_id IS NOT NULL THEN
    SELECT 
      to_timestamp(current_period_end) AT TIME ZONE 'UTC',
      status::text
    INTO 
      v_next_payment_date,
      v_subscription_status
    FROM stripe_subscriptions
    WHERE customer_id = v_stripe_customer_id
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