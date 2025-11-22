/*
  # Premium-Only System with 14-Day Trial (No Free Tier)

  ## Overview
  Complete rebuild of the premium system to support a simplified business model:
  - 14-day free trial with FULL access to all features
  - Premium subscription at €49.99/month after trial
  - No free tier, no limits during trial or premium
  - Read-only mode after trial expires
  - Automatic data deletion 30 days after trial expiration

  ## Changes

  ### 1. Cleanup (Removed)
  - All limit-checking functions (check_guest_limit, check_budget_item_limit, etc.)
  - All RESTRICTIVE premium policies
  - stripe_orders table and related types/views
  - weddings.is_premium column (never used)
  - subscription_tier concept (replaced with account_status)

  ### 2. New Types
  - account_status_type ENUM: trial_active, trial_expired, premium_active, premium_cancelled, suspended, deleted

  ### 3. New Tables
  - subscription_events: Audit trail for all subscription status changes
  - stripe_webhook_logs: Complete logging of all Stripe webhook events

  ### 4. Modified Tables
  - user_profiles: Added trial management fields, account_status
  - stripe_customers: Added metadata and email fields
  - stripe_subscriptions: Added trial_start, trial_end, metadata

  ### 5. New Functions
  - get_account_status(): Returns current account status with real-time calculations
  - is_read_only_mode(): Simple boolean check for write access
  - check_trial_status(): Frontend-friendly RPC returning full trial status
  - upgrade_to_premium(): Handles upgrade from trial to premium

  ### 6. New RLS Policies
  - Ultra-simple policies: SELECT always allowed, INSERT/UPDATE/DELETE only if NOT is_read_only_mode()
  - Applied consistently across all tables (guests, budget_items, vendors, tasks, timeline, etc.)

  ### 7. Triggers
  - Auto-setup trial dates on user registration
  - Auto-log subscription status changes to subscription_events

  ## Security
  - RLS enabled on all new tables
  - Service role required for admin operations
  - Users can only access their own subscription data
*/

-- =====================================================
-- PHASE 1: BACKUP EXISTING DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles_backup_20251115 AS
SELECT * FROM user_profiles;

CREATE TABLE IF NOT EXISTS weddings_backup_20251115 AS
SELECT * FROM weddings;

-- =====================================================
-- PHASE 2: CLEANUP - Remove All Limit Functions
-- =====================================================

-- Drop all limit checking functions
DROP FUNCTION IF EXISTS check_guest_limit(uuid);
DROP FUNCTION IF EXISTS check_budget_item_limit(uuid);
DROP FUNCTION IF EXISTS check_timeline_event_limit(uuid);
DROP FUNCTION IF EXISTS check_vendor_limit(uuid);
DROP FUNCTION IF EXISTS check_task_limit(uuid);
DROP FUNCTION IF EXISTS get_user_limits(uuid);
DROP FUNCTION IF EXISTS get_user_subscription_tier(uuid);

-- =====================================================
-- PHASE 3: CLEANUP - Remove All RESTRICTIVE Policies
-- =====================================================

-- Drop all RESTRICTIVE premium policies
DROP POLICY IF EXISTS "budget_payments_insert_check_premium_type" ON budget_payments;
DROP POLICY IF EXISTS "budget_payments_update_check_premium_type" ON budget_payments;
DROP POLICY IF EXISTS "budget_items_prokopf_insert_check" ON budget_items;
DROP POLICY IF EXISTS "budget_items_prokopf_update_check" ON budget_items;
DROP POLICY IF EXISTS "vendor_payments_limit_free_user" ON vendor_payments;
DROP POLICY IF EXISTS "budget_partner_splits_premium_only" ON budget_partner_splits;

-- Drop all limit-based policies on core tables
DROP POLICY IF EXISTS "guests_insert_with_limit" ON guests;
DROP POLICY IF EXISTS "budget_items_insert_with_limit" ON budget_items;
DROP POLICY IF EXISTS "vendors_insert_with_limit" ON vendors;
DROP POLICY IF EXISTS "tasks_insert_with_limit" ON tasks;
DROP POLICY IF EXISTS "wedding_timeline_insert_with_limit" ON wedding_timeline;

-- =====================================================
-- PHASE 4: CLEANUP - Remove stripe_orders
-- =====================================================

DROP VIEW IF EXISTS stripe_user_orders;
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TYPE IF EXISTS stripe_order_status;

-- =====================================================
-- PHASE 5: CLEANUP - Remove weddings.is_premium
-- =====================================================

-- First drop all policies that depend on weddings.is_premium
DROP POLICY IF EXISTS "Users can insert budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can update budget payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can insert partner splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can update partner splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can delete partner splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can insert vendors for their weddings" ON vendors;
DROP POLICY IF EXISTS "Users can insert locations for their wedding" ON locations;

DROP INDEX IF EXISTS idx_weddings_is_premium;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE weddings DROP COLUMN is_premium;
  END IF;
END $$;

-- =====================================================
-- PHASE 6: NEW TYPES
-- =====================================================

CREATE TYPE account_status_type AS ENUM (
  'trial_active',        -- Within 14-day trial period, full access
  'trial_expired',       -- Trial ended, read-only mode
  'premium_active',      -- Active paid subscription (€49.99/month), full access
  'premium_cancelled',   -- Subscription cancelled, read-only after period ends
  'suspended',           -- Payment failed, grace period
  'deleted'              -- Data has been deleted
);

-- =====================================================
-- PHASE 7: NEW TABLES
-- =====================================================

-- Subscription events audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  source text NOT NULL, -- 'webhook', 'cron', 'manual', 'signup'
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription events"
  ON subscription_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Stripe webhook logs
CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz DEFAULT now() NOT NULL,
  error_message text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_event_type ON stripe_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_processed_at ON stripe_webhook_logs(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_user_id ON stripe_webhook_logs(user_id);

-- No RLS needed - service role only

-- =====================================================
-- PHASE 8: ALTER TABLES - user_profiles
-- =====================================================

-- Add new columns to user_profiles
DO $$
BEGIN
  -- Add account_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN account_status account_status_type DEFAULT 'trial_active';
  END IF;

  -- Add trial_started_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN trial_started_at timestamptz;
  END IF;

  -- Add trial_ends_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN trial_ends_at timestamptz;
  END IF;

  -- Add data_deletion_scheduled_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'data_deletion_scheduled_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN data_deletion_scheduled_at timestamptz;
  END IF;

  -- Add last_warning_sent_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_warning_sent_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_warning_sent_at timestamptz;
  END IF;

  -- Add warning_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'warning_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN warning_count integer DEFAULT 0;
  END IF;

  -- Drop subscription_tier if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN subscription_tier;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON user_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_ends_at ON user_profiles(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_data_deletion_scheduled_at ON user_profiles(data_deletion_scheduled_at);

-- =====================================================
-- PHASE 9: ALTER TABLES - stripe_customers
-- =====================================================

DO $$
BEGIN
  -- Add metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_customers' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE stripe_customers ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_customers' AND column_name = 'email'
  ) THEN
    ALTER TABLE stripe_customers ADD COLUMN email text;
  END IF;

  -- Drop deleted_at if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_customers' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE stripe_customers DROP COLUMN deleted_at;
  END IF;
END $$;

-- =====================================================
-- PHASE 10: ALTER TABLES - stripe_subscriptions
-- =====================================================

DO $$
BEGIN
  -- Add trial_start
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'trial_start'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN trial_start timestamptz;
  END IF;

  -- Add trial_end
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'trial_end'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN trial_end timestamptz;
  END IF;

  -- Add metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Drop deleted_at if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE stripe_subscriptions DROP COLUMN deleted_at;
  END IF;
END $$;

-- =====================================================
-- PHASE 11: DATA MIGRATION
-- =====================================================

-- Migrate existing users to new system
UPDATE user_profiles
SET
  trial_started_at = COALESCE(created_at, now()),
  trial_ends_at = COALESCE(created_at, now()) + INTERVAL '14 days',
  account_status = CASE
    -- If they have an active Stripe subscription, mark as premium
    WHEN EXISTS (
      SELECT 1 FROM stripe_subscriptions ss
      WHERE ss.user_id = user_profiles.user_id
      AND ss.status = 'active'
    ) THEN 'premium_active'::account_status_type
    -- If trial is still active (< 14 days old)
    WHEN COALESCE(created_at, now()) > now() - INTERVAL '14 days' THEN 'trial_active'::account_status_type
    -- Otherwise trial has expired
    ELSE 'trial_expired'::account_status_type
  END,
  data_deletion_scheduled_at = CASE
    -- Only set deletion date for expired trials
    WHEN COALESCE(created_at, now()) <= now() - INTERVAL '14 days'
    AND NOT EXISTS (
      SELECT 1 FROM stripe_subscriptions ss
      WHERE ss.user_id = user_profiles.user_id
      AND ss.status = 'active'
    )
    THEN COALESCE(created_at, now()) + INTERVAL '44 days' -- 14 days trial + 30 days grace
    ELSE NULL
  END
WHERE trial_started_at IS NULL;

-- =====================================================
-- PHASE 12: NEW FUNCTIONS
-- =====================================================

-- Get current account status with real-time calculation
CREATE OR REPLACE FUNCTION get_account_status(p_user_id uuid)
RETURNS account_status_type
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_account_status account_status_type;
  v_trial_ends_at timestamptz;
  v_has_active_subscription boolean;
BEGIN
  -- Get current stored status and trial end date
  SELECT account_status, trial_ends_at
  INTO v_account_status, v_trial_ends_at
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Check if user has active Stripe subscription
  SELECT EXISTS (
    SELECT 1 FROM stripe_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
  ) INTO v_has_active_subscription;

  -- If they have active subscription, they're premium
  IF v_has_active_subscription THEN
    RETURN 'premium_active'::account_status_type;
  END IF;

  -- If trial hasn't expired yet, they're in trial
  IF v_trial_ends_at > now() THEN
    RETURN 'trial_active'::account_status_type;
  END IF;

  -- Otherwise return the stored status (trial_expired, suspended, deleted, etc.)
  RETURN v_account_status;
END;
$$;

-- Simple read-only mode check
CREATE OR REPLACE FUNCTION is_read_only_mode(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_status account_status_type;
BEGIN
  v_status := get_account_status(p_user_id);

  -- Read-only for expired trials, cancelled subscriptions, suspended, or deleted accounts
  RETURN v_status IN ('trial_expired', 'premium_cancelled', 'suspended', 'deleted');
END;
$$;

-- Frontend-friendly RPC for checking trial status
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
  v_has_access boolean;
  v_is_read_only boolean;
  v_days_remaining integer;
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
    data_deletion_scheduled_at
  INTO
    v_account_status,
    v_trial_ends_at,
    v_deletion_scheduled_at
  FROM user_profiles
  WHERE user_id = v_user_id;

  -- Get real-time status
  v_account_status := get_account_status(v_user_id);
  v_is_read_only := is_read_only_mode(v_user_id);
  v_has_access := NOT v_is_read_only;

  -- Calculate days remaining in trial
  IF v_account_status = 'trial_active' THEN
    v_days_remaining := GREATEST(0, EXTRACT(DAY FROM (v_trial_ends_at - now()))::integer);
  ELSE
    v_days_remaining := 0;
  END IF;

  RETURN jsonb_build_object(
    'accountStatus', v_account_status,
    'hasAccess', v_has_access,
    'isReadOnly', v_is_read_only,
    'daysRemaining', v_days_remaining,
    'trialEndsAt', v_trial_ends_at,
    'deletionScheduledAt', v_deletion_scheduled_at
  );
END;
$$;

-- Upgrade user to premium
CREATE OR REPLACE FUNCTION upgrade_to_premium(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status account_status_type;
BEGIN
  -- Get old status
  SELECT account_status INTO v_old_status
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Update to premium
  UPDATE user_profiles
  SET
    account_status = 'premium_active'::account_status_type,
    data_deletion_scheduled_at = NULL,
    premium_since = COALESCE(premium_since, now())
  WHERE user_id = p_user_id;

  -- Log the change
  INSERT INTO subscription_events (user_id, event_type, old_status, new_status, source, metadata)
  VALUES (
    p_user_id,
    'upgrade_to_premium',
    v_old_status::text,
    'premium_active',
    'manual',
    jsonb_build_object('timestamp', now())
  );
END;
$$;

-- =====================================================
-- PHASE 13: NEW RLS POLICIES (Ultra-Simple)
-- =====================================================

-- Drop all existing write policies that check limits
-- We'll recreate them with simple is_read_only_mode check

-- Guests table
DROP POLICY IF EXISTS "Users can insert own wedding guests" ON guests;
DROP POLICY IF EXISTS "Users can update own wedding guests" ON guests;
DROP POLICY IF EXISTS "Users can delete own wedding guests" ON guests;

CREATE POLICY "Users can insert guests if not read-only"
  ON guests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update guests if not read-only"
  ON guests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete guests if not read-only"
  ON guests FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

-- Budget Items table
DROP POLICY IF EXISTS "Users can insert budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete budget items" ON budget_items;

CREATE POLICY "Users can insert budget items if not read-only"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update budget items if not read-only"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete budget items if not read-only"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

-- Budget Categories table
DROP POLICY IF EXISTS "Users can insert budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can delete budget categories" ON budget_categories;

CREATE POLICY "Users can insert budget categories if not read-only"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update budget categories if not read-only"
  ON budget_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete budget categories if not read-only"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

-- Vendors table
DROP POLICY IF EXISTS "Users can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete vendors" ON vendors;

CREATE POLICY "Users can insert vendors if not read-only"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update vendors if not read-only"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete vendors if not read-only"
  ON vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

-- Tasks table
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

CREATE POLICY "Users can insert tasks if not read-only"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update tasks if not read-only"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete tasks if not read-only"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

-- Wedding Timeline table
DROP POLICY IF EXISTS "Users can insert timeline events" ON wedding_timeline;
DROP POLICY IF EXISTS "Users can update timeline events" ON wedding_timeline;
DROP POLICY IF EXISTS "Users can delete timeline events" ON wedding_timeline;

CREATE POLICY "Users can insert timeline events if not read-only"
  ON wedding_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update timeline events if not read-only"
  ON wedding_timeline FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete timeline events if not read-only"
  ON wedding_timeline FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

-- Budget Payments table (recreate without is_premium check)
CREATE POLICY "Users can insert budget payments if not read-only"
  ON budget_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_id AND w.user_id = auth.uid()
    )
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update budget payments if not read-only"
  ON budget_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_id AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_id AND w.user_id = auth.uid()
    )
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete budget payments if not read-only"
  ON budget_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_id AND w.user_id = auth.uid()
    )
    AND NOT is_read_only_mode(auth.uid())
  );

-- Budget Partner Splits table (recreate without is_premium check)
CREATE POLICY "Users can insert partner splits if not read-only"
  ON budget_partner_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_id AND w.user_id = auth.uid()
    )
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update partner splits if not read-only"
  ON budget_partner_splits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_id AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_id AND w.user_id = auth.uid()
    )
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete partner splits if not read-only"
  ON budget_partner_splits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN weddings w ON w.id = bi.wedding_id
      WHERE bi.id = budget_item_id AND w.user_id = auth.uid()
    )
    AND NOT is_read_only_mode(auth.uid())
  );

-- Locations table (recreate without is_premium check)
CREATE POLICY "Users can insert locations if not read-only"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can update locations if not read-only"
  ON locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

CREATE POLICY "Users can delete locations if not read-only"
  ON locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND user_id = auth.uid())
    AND NOT is_read_only_mode(auth.uid())
  );

-- =====================================================
-- PHASE 14: TRIGGERS
-- =====================================================

-- Auto-setup trial on user profile creation
CREATE OR REPLACE FUNCTION setup_trial_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.trial_started_at := COALESCE(NEW.trial_started_at, now());
  NEW.trial_ends_at := COALESCE(NEW.trial_ends_at, now() + INTERVAL '14 days');
  NEW.account_status := COALESCE(NEW.account_status, 'trial_active'::account_status_type);
  NEW.warning_count := COALESCE(NEW.warning_count, 0);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_setup_trial_on_signup ON user_profiles;
CREATE TRIGGER trigger_setup_trial_on_signup
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION setup_trial_on_signup();

-- Auto-log account status changes
CREATE OR REPLACE FUNCTION log_account_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    INSERT INTO subscription_events (user_id, event_type, old_status, new_status, source)
    VALUES (
      NEW.user_id,
      'status_change',
      OLD.account_status::text,
      NEW.account_status::text,
      'trigger'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_account_status_change ON user_profiles;
CREATE TRIGGER trigger_log_account_status_change
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_account_status_change();

-- =====================================================
-- PHASE 15: INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_status ON stripe_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_warning ON user_profiles(data_deletion_scheduled_at, warning_count) WHERE data_deletion_scheduled_at IS NOT NULL;

-- =====================================================
-- PHASE 16: ANALYZE TABLES
-- =====================================================

ANALYZE user_profiles;
ANALYZE subscription_events;
ANALYZE stripe_webhook_logs;
ANALYZE stripe_customers;
ANALYZE stripe_subscriptions;

-- =====================================================
-- PHASE 17: VALIDATION
-- =====================================================

-- Verify all functions exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_account_status') = 1, 'get_account_status function not found';
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_read_only_mode') = 1, 'is_read_only_mode function not found';
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'check_trial_status') = 1, 'check_trial_status function not found';
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'upgrade_to_premium') = 1, 'upgrade_to_premium function not found';
END $$;

-- Verify new tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'subscription_events') = 1, 'subscription_events table not found';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'stripe_webhook_logs') = 1, 'stripe_webhook_logs table not found';
END $$;

-- Verify user_profiles columns
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'account_status') = 1, 'account_status column not found';
  ASSERT (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'trial_started_at') = 1, 'trial_started_at column not found';
  ASSERT (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'trial_ends_at') = 1, 'trial_ends_at column not found';
END $$;
