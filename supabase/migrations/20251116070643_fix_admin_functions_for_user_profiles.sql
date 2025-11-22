/*
  # Fix Admin Functions to Use user_profiles Instead of weddings

  1. Problem
    - Admin functions reference old columns in weddings table
    - Trial/premium data is now in user_profiles table
    - Functions need to be updated to reflect new schema

  2. Changes
    - Update get_user_stats() to query user_profiles
    - Update get_conversion_rate() to use user_profiles
    - Update calculate_mrr() to use user_profiles
    - Remove functions that operate on non-existent weddings columns
*/

-- Update get_user_stats function
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
  v_total_users int;
  v_active_trials int;
  v_premium_users int;
  v_trial_expired_users int;
  v_new_today int;
  v_mrr numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM user_profiles;

  SELECT COUNT(*) INTO v_active_trials
  FROM user_profiles
  WHERE trial_ends_at > now()
  AND (NOT is_premium OR is_premium IS FALSE);

  SELECT COUNT(*) INTO v_premium_users
  FROM user_profiles
  WHERE is_premium = true;

  SELECT COUNT(*) INTO v_trial_expired_users
  FROM user_profiles
  WHERE account_status = 'trial_expired';

  SELECT COUNT(*) INTO v_new_today
  FROM user_profiles
  WHERE DATE(created_at) = CURRENT_DATE;

  v_mrr := calculate_mrr();

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'active_trials', v_active_trials,
    'premium_users', v_premium_users,
    'trial_expired_users', v_trial_expired_users,
    'new_today', v_new_today,
    'mrr', v_mrr
  );
END;
$$;

-- Update calculate_mrr function
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr numeric;
  v_price numeric := 49.99;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT COUNT(*) * v_price INTO v_mrr
  FROM user_profiles
  WHERE is_premium = true;

  RETURN COALESCE(v_mrr, 0);
END;
$$;

-- Update get_conversion_rate function
CREATE OR REPLACE FUNCTION get_conversion_rate(
  p_start_date timestamptz DEFAULT (now() - interval '30 days'),
  p_end_date timestamptz DEFAULT now()
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_trials int;
  v_conversions int;
  v_rate numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT COUNT(*) INTO v_total_trials
  FROM user_profiles
  WHERE trial_started_at >= p_start_date
  AND trial_started_at <= p_end_date;

  SELECT COUNT(*) INTO v_conversions
  FROM user_profiles
  WHERE trial_started_at >= p_start_date
  AND trial_started_at <= p_end_date
  AND is_premium = true;

  IF v_total_trials = 0 THEN
    RETURN 0;
  END IF;

  v_rate := (v_conversions::numeric / v_total_trials::numeric) * 100;
  RETURN ROUND(v_rate, 2);
END;
$$;
