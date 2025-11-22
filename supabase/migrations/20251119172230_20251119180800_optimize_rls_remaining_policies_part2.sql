/*
  # Optimize RLS Policies - Remaining Tables Part 2

  1. Purpose
    - Optimize auth.uid() calls in RLS policies
    - Includes: guests, hero_journey_visits, location_category_assignments, family_groups, vendor_categories, budget_items, weddings, subscription_events, location_event_assignments, admin tables

  2. Tables Updated
    - guests (4 policies)
    - hero_journey_visits (2 policies)
    - location_category_assignments (3 policies)
    - family_groups (2 policies)
    - vendor_categories (4 policies)
    - budget_items (4 policies)
    - weddings (1 policy)
    - subscription_events (1 policy)
    - location_event_assignments (3 policies)
    - admin_audit_log (2 policies)
    - admin_support_notes (4 policies)
*/

-- guests policies
DROP POLICY IF EXISTS "Users can view guests for their weddings" ON guests;
DROP POLICY IF EXISTS "Users can insert guests" ON guests;
DROP POLICY IF EXISTS "Users can update guests" ON guests;
DROP POLICY IF EXISTS "Users can delete guests" ON guests;

CREATE POLICY "Users can view guests for their weddings"
  ON guests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert guests"
  ON guests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update guests"
  ON guests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete guests"
  ON guests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- hero_journey_visits policies
DROP POLICY IF EXISTS "Users can view their wedding's visits" ON hero_journey_visits;
DROP POLICY IF EXISTS "Users can insert their wedding's visits" ON hero_journey_visits;

CREATE POLICY "Users can view their wedding's visits"
  ON hero_journey_visits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_visits.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their wedding's visits"
  ON hero_journey_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = hero_journey_visits.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- location_category_assignments policies
DROP POLICY IF EXISTS "Users can view their location category assignments" ON location_category_assignments;
DROP POLICY IF EXISTS "Users can insert their location category assignments" ON location_category_assignments;
DROP POLICY IF EXISTS "Users can delete their location category assignments" ON location_category_assignments;

CREATE POLICY "Users can view their location category assignments"
  ON location_category_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_category_assignments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their location category assignments"
  ON location_category_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_category_assignments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their location category assignments"
  ON location_category_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      JOIN weddings ON weddings.id = locations.wedding_id
      WHERE locations.id = location_category_assignments.location_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- family_groups policies
DROP POLICY IF EXISTS "Users can create family groups for their weddings" ON family_groups;
DROP POLICY IF EXISTS "Users can update family groups for their weddings" ON family_groups;

CREATE POLICY "Users can create family groups for their weddings"
  ON family_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update family groups for their weddings"
  ON family_groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = family_groups.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- vendor_categories policies
DROP POLICY IF EXISTS "Users can view vendor categories for their weddings" ON vendor_categories;
DROP POLICY IF EXISTS "Users can insert vendor categories for their weddings" ON vendor_categories;
DROP POLICY IF EXISTS "Users can update vendor categories for their weddings" ON vendor_categories;
DROP POLICY IF EXISTS "Users can delete vendor categories for their weddings" ON vendor_categories;

CREATE POLICY "Users can view vendor categories for their weddings"
  ON vendor_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert vendor categories for their weddings"
  ON vendor_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update vendor categories for their weddings"
  ON vendor_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete vendor categories for their weddings"
  ON vendor_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_categories.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- budget_items policies
DROP POLICY IF EXISTS "Users can view budget items for their weddings" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete budget items" ON budget_items;

CREATE POLICY "Users can view budget items for their weddings"
  ON budget_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert budget items"
  ON budget_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update budget items"
  ON budget_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete budget items"
  ON budget_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- weddings policies
DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;

CREATE POLICY "Users can insert own weddings"
  ON weddings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- subscription_events policies
DROP POLICY IF EXISTS "Users can view own subscription events" ON subscription_events;

CREATE POLICY "Users can view own subscription events"
  ON subscription_events
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- location_event_assignments policies (has wedding_id directly)
DROP POLICY IF EXISTS "Users can view location assignments for their weddings" ON location_event_assignments;
DROP POLICY IF EXISTS "Users can insert location assignments for their weddings" ON location_event_assignments;
DROP POLICY IF EXISTS "Users can delete location assignments for their weddings" ON location_event_assignments;

CREATE POLICY "Users can view location assignments for their weddings"
  ON location_event_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_event_assignments.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert location assignments for their weddings"
  ON location_event_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_event_assignments.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete location assignments for their weddings"
  ON location_event_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = location_event_assignments.wedding_id
      AND weddings.user_id = (select auth.uid())
    )
  );

-- admin_audit_log policies
DROP POLICY IF EXISTS "Admins can read all audit logs" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_audit_log;

CREATE POLICY "Admins can read all audit logs"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  );

-- admin_support_notes policies
DROP POLICY IF EXISTS "Admins can read all support notes" ON admin_support_notes;
DROP POLICY IF EXISTS "Admins can insert support notes" ON admin_support_notes;
DROP POLICY IF EXISTS "Admins can update own support notes" ON admin_support_notes;
DROP POLICY IF EXISTS "Admins can delete own support notes" ON admin_support_notes;

CREATE POLICY "Admins can read all support notes"
  ON admin_support_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Admins can insert support notes"
  ON admin_support_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Admins can update own support notes"
  ON admin_support_notes
  FOR UPDATE
  TO authenticated
  USING (
    admin_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  )
  WITH CHECK (
    admin_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Admins can delete own support notes"
  ON admin_support_notes
  FOR DELETE
  TO authenticated
  USING (
    admin_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  );
