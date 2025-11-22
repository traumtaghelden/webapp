/*
  # Optimize RLS Policies - Remaining Tables Part 1

  1. Purpose
    - Optimize auth.uid() calls in RLS policies
    - Includes: budget_partner_splits, user_consent, hero_journey_progress, hero_journey_milestones

  2. Tables Updated
    - budget_partner_splits (3 policies)
    - user_consent (4 policies)
    - hero_journey_progress (4 policies)
    - hero_journey_milestones (3 policies)
*/

-- budget_partner_splits policies
DROP POLICY IF EXISTS "Users can insert partner splits if not read-only" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can update partner splits if not read-only" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can delete partner splits if not read-only" ON budget_partner_splits;

CREATE POLICY "Users can insert partner splits if not read-only"
  ON budget_partner_splits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update partner splits if not read-only"
  ON budget_partner_splits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete partner splits if not read-only"
  ON budget_partner_splits
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- user_consent policies
DROP POLICY IF EXISTS "Users can view own consent records" ON user_consent;
DROP POLICY IF EXISTS "Users can insert own consent records" ON user_consent;
DROP POLICY IF EXISTS "Users can update own consent records" ON user_consent;
DROP POLICY IF EXISTS "Users can delete own consent records" ON user_consent;

CREATE POLICY "Users can view own consent records"
  ON user_consent
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own consent records"
  ON user_consent
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own consent records"
  ON user_consent
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own consent records"
  ON user_consent
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- hero_journey_progress policies
DROP POLICY IF EXISTS "Users can view their wedding's journey progress" ON hero_journey_progress;
DROP POLICY IF EXISTS "Users can insert their wedding's journey progress" ON hero_journey_progress;
DROP POLICY IF EXISTS "Users can update their wedding's journey progress" ON hero_journey_progress;
DROP POLICY IF EXISTS "Users can delete their wedding's journey progress" ON hero_journey_progress;

CREATE POLICY "Users can view their wedding's journey progress"
  ON hero_journey_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their wedding's journey progress"
  ON hero_journey_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their wedding's journey progress"
  ON hero_journey_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their wedding's journey progress"
  ON hero_journey_progress
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- hero_journey_milestones policies
DROP POLICY IF EXISTS "Users can view their wedding's milestones" ON hero_journey_milestones;
DROP POLICY IF EXISTS "Users can insert their wedding's milestones" ON hero_journey_milestones;
DROP POLICY IF EXISTS "Users can delete their wedding's milestones" ON hero_journey_milestones;

CREATE POLICY "Users can view their wedding's milestones"
  ON hero_journey_milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_milestones.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their wedding's milestones"
  ON hero_journey_milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_milestones.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their wedding's milestones"
  ON hero_journey_milestones
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_milestones.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );
