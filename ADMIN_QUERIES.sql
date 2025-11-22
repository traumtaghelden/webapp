-- =====================================================
-- ADMIN MONITORING QUERIES
-- Premium-Only System with 14-Day Trial
-- =====================================================

-- =====================================================
-- 1. OVERVIEW STATISTICS
-- =====================================================

-- Get overall subscription statistics
SELECT
  account_status,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_profiles
GROUP BY account_status
ORDER BY user_count DESC;

-- =====================================================
-- 2. TRIAL MONITORING
-- =====================================================

-- Active trials expiring soon (next 7 days)
SELECT
  up.id,
  up.email,
  up.trial_started_at,
  up.trial_ends_at,
  EXTRACT(DAY FROM (up.trial_ends_at - NOW())) as days_remaining,
  up.warning_count
FROM user_profiles up
WHERE up.account_status = 'trial_active'
  AND up.trial_ends_at <= NOW() + INTERVAL '7 days'
ORDER BY up.trial_ends_at ASC;

-- Trials that expired today
SELECT
  up.id,
  up.email,
  up.trial_started_at,
  up.trial_ends_at,
  up.account_status
FROM user_profiles up
WHERE DATE(up.trial_ends_at) = CURRENT_DATE
ORDER BY up.trial_ends_at DESC;

-- =====================================================
-- 3. DELETION MONITORING
-- =====================================================

-- Users scheduled for deletion (next 7 days)
SELECT
  up.id,
  up.email,
  up.trial_ends_at,
  up.data_deletion_scheduled_at,
  EXTRACT(DAY FROM (up.data_deletion_scheduled_at - NOW())) as days_until_deletion,
  up.warning_count,
  up.last_warning_sent_at
FROM user_profiles up
WHERE up.data_deletion_scheduled_at IS NOT NULL
  AND up.data_deletion_scheduled_at <= NOW() + INTERVAL '7 days'
ORDER BY up.data_deletion_scheduled_at ASC;

-- Users that should be deleted today
SELECT
  up.id,
  up.email,
  up.data_deletion_scheduled_at,
  up.account_status,
  DATE(up.data_deletion_scheduled_at) as deletion_date
FROM user_profiles up
WHERE DATE(up.data_deletion_scheduled_at) = CURRENT_DATE
  AND up.account_status != 'deleted'
ORDER BY up.data_deletion_scheduled_at ASC;

-- =====================================================
-- 4. REVENUE MONITORING
-- =====================================================

-- Active premium subscriptions
SELECT
  COUNT(*) as active_premium_users,
  COUNT(*) * 49.99 as monthly_recurring_revenue
FROM user_profiles up
WHERE up.account_status = 'premium_active';

-- Premium conversions from trial (last 30 days)
SELECT
  DATE(se.created_at) as conversion_date,
  COUNT(*) as conversions
FROM subscription_events se
WHERE se.event_type = 'upgrade_to_premium'
  AND se.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(se.created_at)
ORDER BY conversion_date DESC;

-- Conversion rate (trial → premium)
WITH trial_starts AS (
  SELECT COUNT(*) as count
  FROM user_profiles
  WHERE trial_started_at >= NOW() - INTERVAL '30 days'
),
conversions AS (
  SELECT COUNT(*) as count
  FROM subscription_events
  WHERE event_type = 'upgrade_to_premium'
    AND created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  trial_starts.count as trials_started,
  conversions.count as conversions,
  ROUND(conversions.count * 100.0 / NULLIF(trial_starts.count, 0), 2) as conversion_rate_percent
FROM trial_starts, conversions;

-- =====================================================
-- 5. SUBSCRIPTION EVENTS ANALYSIS
-- =====================================================

-- Recent subscription events (last 24 hours)
SELECT
  se.created_at,
  se.event_type,
  se.old_status,
  se.new_status,
  se.source,
  up.email
FROM subscription_events se
JOIN user_profiles up ON up.id = se.user_id
WHERE se.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY se.created_at DESC
LIMIT 50;

-- Event type distribution (last 30 days)
SELECT
  event_type,
  COUNT(*) as event_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM subscription_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY event_count DESC;

-- =====================================================
-- 6. STRIPE WEBHOOK MONITORING
-- =====================================================

-- Recent webhook events
SELECT
  processed_at,
  event_type,
  event_id,
  error_message,
  up.email
FROM stripe_webhook_logs swl
LEFT JOIN user_profiles up ON up.id = swl.user_id
ORDER BY processed_at DESC
LIMIT 50;

-- Failed webhooks (last 7 days)
SELECT
  processed_at,
  event_type,
  event_id,
  error_message,
  up.email
FROM stripe_webhook_logs swl
LEFT JOIN user_profiles up ON up.id = swl.user_id
WHERE error_message IS NOT NULL
  AND processed_at >= NOW() - INTERVAL '7 days'
ORDER BY processed_at DESC;

-- Webhook event types distribution
SELECT
  event_type,
  COUNT(*) as count,
  COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count,
  ROUND(
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as error_rate_percent
FROM stripe_webhook_logs
WHERE processed_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;

-- =====================================================
-- 7. USER ENGAGEMENT
-- =====================================================

-- New signups per day (last 30 days)
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as new_users
FROM user_profiles
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Users by trial completion stage
SELECT
  CASE
    WHEN trial_ends_at > NOW() + INTERVAL '10 days' THEN 'Early (11-14 days left)'
    WHEN trial_ends_at > NOW() + INTERVAL '5 days' THEN 'Mid (6-10 days left)'
    WHEN trial_ends_at > NOW() THEN 'Late (1-5 days left)'
    ELSE 'Expired'
  END as trial_stage,
  COUNT(*) as user_count
FROM user_profiles
WHERE account_status IN ('trial_active', 'trial_expired')
GROUP BY
  CASE
    WHEN trial_ends_at > NOW() + INTERVAL '10 days' THEN 'Early (11-14 days left)'
    WHEN trial_ends_at > NOW() + INTERVAL '5 days' THEN 'Mid (6-10 days left)'
    WHEN trial_ends_at > NOW() THEN 'Late (1-5 days left)'
    ELSE 'Expired'
  END
ORDER BY user_count DESC;

-- =====================================================
-- 8. DATA HEALTH CHECKS
-- =====================================================

-- Users with inconsistent status (should be rare/none)
SELECT
  up.id,
  up.email,
  up.account_status as stored_status,
  get_account_status(up.id) as computed_status,
  up.trial_ends_at,
  EXISTS (
    SELECT 1 FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON sc.customer_id = ss.customer_id
    WHERE sc.user_id = up.id AND ss.status = 'active'
  ) as has_active_stripe_sub
FROM user_profiles up
WHERE up.account_status != get_account_status(up.id)
LIMIT 20;

-- Users missing trial dates
SELECT
  id,
  email,
  created_at,
  trial_started_at,
  trial_ends_at,
  account_status
FROM user_profiles
WHERE trial_started_at IS NULL
  OR trial_ends_at IS NULL
LIMIT 20;

-- =====================================================
-- 9. SPECIFIC USER LOOKUP
-- =====================================================

-- Get full user subscription details
-- Replace 'user-email@example.com' with actual email
SELECT
  up.id,
  up.email,
  up.account_status,
  get_account_status(up.id) as computed_status,
  is_read_only_mode(up.id) as is_read_only,
  up.trial_started_at,
  up.trial_ends_at,
  EXTRACT(DAY FROM (up.trial_ends_at - NOW())) as days_remaining,
  up.data_deletion_scheduled_at,
  up.warning_count,
  up.last_warning_sent_at,
  up.premium_since,
  up.stripe_customer_id,
  up.created_at
FROM user_profiles up
WHERE up.email = 'user-email@example.com';

-- Get user's subscription events
-- Replace 'user-id' with actual UUID
SELECT
  created_at,
  event_type,
  old_status,
  new_status,
  source,
  metadata
FROM subscription_events
WHERE user_id = 'user-id'
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- 10. PERFORMANCE METRICS
-- =====================================================

-- Average time from trial start to conversion
SELECT
  AVG(EXTRACT(DAY FROM (se.created_at - up.trial_started_at))) as avg_days_to_conversion,
  MIN(EXTRACT(DAY FROM (se.created_at - up.trial_started_at))) as min_days,
  MAX(EXTRACT(DAY FROM (se.created_at - up.trial_started_at))) as max_days,
  COUNT(*) as total_conversions
FROM subscription_events se
JOIN user_profiles up ON up.id = se.user_id
WHERE se.event_type = 'upgrade_to_premium'
  AND se.created_at >= NOW() - INTERVAL '90 days';

-- Churn analysis (cancelled subscriptions)
SELECT
  DATE_TRUNC('week', se.created_at) as week,
  COUNT(*) as cancellations
FROM subscription_events se
WHERE se.event_type IN ('subscription_cancelled', 'status_change')
  AND se.new_status = 'premium_cancelled'
  AND se.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', se.created_at)
ORDER BY week DESC;
