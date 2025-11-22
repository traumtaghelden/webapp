/*
  # Fix RLS Auth Performance - Batch 4
  
  1. Optimization
    - Fix auth.uid() performance issues in RLS policies by using (SELECT auth.uid())
    - Tables covered: user_consent, hero_journey_progress, hero_journey_milestones, guests, family_groups
  
  2. Security
    - Maintains existing security model while improving performance
    - Each policy properly checks user ownership
*/

-- user_consent policies
DROP POLICY IF EXISTS "Users can view their own consent" ON user_consent;
DROP POLICY IF EXISTS "Users can insert their own consent" ON user_consent;
DROP POLICY IF EXISTS "Users can update their own consent" ON user_consent;

CREATE POLICY "Users can view their own consent"
  ON user_consent FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own consent"
  ON user_consent FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own consent"
  ON user_consent FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- hero_journey_progress policies
DROP POLICY IF EXISTS "Users can view hero_journey_progress for their wedding" ON hero_journey_progress;
DROP POLICY IF EXISTS "Users can insert hero_journey_progress for their wedding" ON hero_journey_progress;
DROP POLICY IF EXISTS "Users can update hero_journey_progress for their wedding" ON hero_journey_progress;
DROP POLICY IF EXISTS "Users can delete hero_journey_progress for their wedding" ON hero_journey_progress;

CREATE POLICY "Users can view hero_journey_progress for their wedding"
  ON hero_journey_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert hero_journey_progress for their wedding"
  ON hero_journey_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update hero_journey_progress for their wedding"
  ON hero_journey_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete hero_journey_progress for their wedding"
  ON hero_journey_progress FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_progress.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- hero_journey_milestones policies
DROP POLICY IF EXISTS "Users can view hero_journey_milestones for their wedding" ON hero_journey_milestones;
DROP POLICY IF EXISTS "Users can insert hero_journey_milestones for their wedding" ON hero_journey_milestones;
DROP POLICY IF EXISTS "Users can update hero_journey_milestones for their wedding" ON hero_journey_milestones;
DROP POLICY IF EXISTS "Users can delete hero_journey_milestones for their wedding" ON hero_journey_milestones;

CREATE POLICY "Users can view hero_journey_milestones for their wedding"
  ON hero_journey_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_milestones.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert hero_journey_milestones for their wedding"
  ON hero_journey_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_milestones.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update hero_journey_milestones for their wedding"
  ON hero_journey_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_milestones.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_milestones.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete hero_journey_milestones for their wedding"
  ON hero_journey_milestones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_milestones.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- guests policies
DROP POLICY IF EXISTS "Users can view guests for their wedding" ON guests;
DROP POLICY IF EXISTS "Users can insert guests for their wedding" ON guests;
DROP POLICY IF EXISTS "Users can update guests for their wedding" ON guests;
DROP POLICY IF EXISTS "Users can delete guests for their wedding" ON guests;

CREATE POLICY "Users can view guests for their wedding"
  ON guests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert guests for their wedding"
  ON guests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update guests for their wedding"
  ON guests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete guests for their wedding"
  ON guests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- family_groups policies
DROP POLICY IF EXISTS "Users can view family_groups for their wedding" ON family_groups;
DROP POLICY IF EXISTS "Users can insert family_groups for their wedding" ON family_groups;
DROP POLICY IF EXISTS "Users can update family_groups for their wedding" ON family_groups;
DROP POLICY IF EXISTS "Users can delete family_groups for their wedding" ON family_groups;

CREATE POLICY "Users can view family_groups for their wedding"
  ON family_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert family_groups for their wedding"
  ON family_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update family_groups for their wedding"
  ON family_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete family_groups for their wedding"
  ON family_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );
