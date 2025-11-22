-- =====================================================
-- WEBHOOK STATUS TEST
-- =====================================================
-- Run this query to check if webhooks are working correctly

-- 1. Check recent webhook logs
SELECT 
  event_type,
  created_at,
  error_message,
  payload->>'id' as stripe_event_id,
  payload->>'object' as object_type
FROM stripe_webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check user account status
SELECT 
  up.email,
  up.account_status,
  up.premium_since,
  up.trial_ends_at,
  up.stripe_customer_id,
  up.created_at
FROM user_profiles up
ORDER BY up.created_at DESC 
LIMIT 5;

-- 3. Check subscriptions
SELECT 
  ss.user_id,
  ss.stripe_subscription_id,
  ss.status,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.created_at
FROM stripe_subscriptions ss
ORDER BY ss.created_at DESC 
LIMIT 5;

-- 4. Check subscription events log
SELECT 
  se.user_id,
  se.event_type,
  se.old_status,
  se.new_status,
  se.created_at
FROM subscription_events se
ORDER BY se.created_at DESC 
LIMIT 10;

-- 5. Test check_trial_status function
SELECT check_trial_status();
