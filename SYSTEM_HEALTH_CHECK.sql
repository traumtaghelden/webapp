-- =====================================================
-- SYSTEM HEALTH CHECK
-- Premium-Only System mit 14-Tage-Trial
-- =====================================================
-- Run this query to verify the system is working correctly
-- All checks should show "PASS" status

WITH health_checks AS (
  -- Core Functions Check
  SELECT
    'Database Functions' as category,
    'Core Functions' as check_name,
    CASE
      WHEN COUNT(*) = 4 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' / 4 functions' as details
  FROM pg_proc
  WHERE proname IN ('get_account_status', 'is_read_only_mode', 'check_trial_status', 'upgrade_to_premium')

  UNION ALL

  -- Admin Functions Check
  SELECT
    'Database Functions' as category,
    'Admin Functions' as check_name,
    CASE
      WHEN COUNT(*) = 5 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' / 5 functions' as details
  FROM pg_proc
  WHERE proname IN ('get_system_statistics', 'extend_trial_period', 'extend_grace_period', 'cancel_scheduled_deletion', 'force_premium_activation')

  UNION ALL

  -- Premium Tables Check
  SELECT
    'Database Tables' as category,
    'Premium Tables' as check_name,
    CASE
      WHEN COUNT(*) = 2 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' / 2 tables' as details
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('subscription_events', 'stripe_webhook_logs')

  UNION ALL

  -- ENUM Type Check
  SELECT
    'Database Schema' as category,
    'Account Status ENUM' as check_name,
    CASE
      WHEN COUNT(*) = 6 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' / 6 values' as details
  FROM pg_enum
  WHERE enumtypid = 'account_status_type'::regtype

  UNION ALL

  -- RLS Policy Checks
  SELECT
    'RLS Policies' as category,
    'Guests Table' as check_name,
    CASE
      WHEN COUNT(*) >= 3 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' policies' as details
  FROM pg_policies
  WHERE tablename = 'guests'
    AND policyname LIKE '%read-only%'

  UNION ALL

  SELECT
    'RLS Policies' as category,
    'Budget Items Table' as check_name,
    CASE
      WHEN COUNT(*) >= 3 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' policies' as details
  FROM pg_policies
  WHERE tablename = 'budget_items'
    AND policyname LIKE '%read-only%'

  UNION ALL

  SELECT
    'RLS Policies' as category,
    'Vendors Table' as check_name,
    CASE
      WHEN COUNT(*) >= 3 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' policies' as details
  FROM pg_policies
  WHERE tablename = 'vendors'
    AND policyname LIKE '%read-only%'

  UNION ALL

  SELECT
    'RLS Policies' as category,
    'Tasks Table' as check_name,
    CASE
      WHEN COUNT(*) >= 3 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' policies' as details
  FROM pg_policies
  WHERE tablename = 'tasks'
    AND policyname LIKE '%read-only%'

  UNION ALL

  SELECT
    'RLS Policies' as category,
    'Timeline Table' as check_name,
    CASE
      WHEN COUNT(*) >= 3 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' policies' as details
  FROM pg_policies
  WHERE tablename = 'wedding_timeline'
    AND policyname LIKE '%read-only%'

  UNION ALL

  -- User Profiles Column Check
  SELECT
    'User Profiles' as category,
    'Trial Columns' as check_name,
    CASE
      WHEN COUNT(*) = 6 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' / 6 columns' as details
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
    AND column_name IN ('account_status', 'trial_started_at', 'trial_ends_at', 'data_deletion_scheduled_at', 'warning_count', 'last_warning_sent_at')

  UNION ALL

  -- Triggers Check
  SELECT
    'Triggers' as category,
    'User Profile Triggers' as check_name,
    CASE
      WHEN COUNT(*) >= 2 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' triggers' as details
  FROM information_schema.triggers
  WHERE event_object_table = 'user_profiles'
    AND trigger_name IN ('trigger_setup_trial_on_signup', 'trigger_log_account_status_change')

  UNION ALL

  -- Indexes Check
  SELECT
    'Indexes' as category,
    'Performance Indexes' as check_name,
    CASE
      WHEN COUNT(*) >= 5 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' indexes' as details
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_user_profiles_account_status',
      'idx_user_profiles_trial_ends_at',
      'idx_user_profiles_data_deletion_scheduled_at',
      'idx_subscription_events_user_id',
      'idx_subscription_events_created_at'
    )

  UNION ALL

  -- Stripe Tables Check
  SELECT
    'Stripe Integration' as category,
    'Stripe Tables' as check_name,
    CASE
      WHEN COUNT(*) = 2 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*)::text || ' / 2 tables' as details
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('stripe_customers', 'stripe_subscriptions')
)
SELECT
  category,
  check_name,
  status,
  details,
  CASE
    WHEN status = 'PASS' THEN '✅'
    ELSE '❌'
  END as icon
FROM health_checks
ORDER BY
  CASE category
    WHEN 'Database Functions' THEN 1
    WHEN 'Database Tables' THEN 2
    WHEN 'Database Schema' THEN 3
    WHEN 'RLS Policies' THEN 4
    WHEN 'User Profiles' THEN 5
    WHEN 'Triggers' THEN 6
    WHEN 'Indexes' THEN 7
    WHEN 'Stripe Integration' THEN 8
  END,
  check_name;

-- =====================================================
-- SUMMARY
-- =====================================================
-- If all checks show PASS (✅), the system is healthy!
-- If any checks show FAIL (❌), investigate immediately.
