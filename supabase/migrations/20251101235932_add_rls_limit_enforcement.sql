/*
  # Add RLS Policies with Limit Enforcement

  1. Changes
    - Add INSERT policies to guests table that check limits
    - Add INSERT policies to budget_items table that check limits
    - Add INSERT policies to wedding_timeline table that check limits
    - Add INSERT policies to vendors table that check limits

  2. Security
    - Policies use the limit validation functions
    - INSERT is blocked with meaningful error when limit is reached
    - Premium users bypass all limits
    - Existing UPDATE/DELETE/SELECT policies remain unchanged

  3. Important Notes
    - Policies only restrict INSERT operations
    - Free users are limited by subscription tier
    - Premium users have unrestricted access
*/

-- Drop existing INSERT policies if they exist and recreate with limit checks

-- Guests table: Add limit check to INSERT policy
DROP POLICY IF EXISTS "Users can insert guests for their weddings" ON guests;

CREATE POLICY "Users can insert guests for their weddings"
  ON guests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
    AND check_guest_limit(auth.uid(), guests.wedding_id)
  );

-- Budget items table: Add limit check to INSERT policy
DROP POLICY IF EXISTS "Users can insert budget items for their weddings" ON budget_items;

CREATE POLICY "Users can insert budget items for their weddings"
  ON budget_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
    AND check_budget_item_limit(auth.uid(), budget_items.wedding_id)
  );

-- Wedding timeline table: Add limit check to INSERT policy
DROP POLICY IF EXISTS "Users can insert timeline events for their weddings" ON wedding_timeline;

CREATE POLICY "Users can insert timeline events for their weddings"
  ON wedding_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_timeline.wedding_id
      AND weddings.user_id = auth.uid()
    )
    AND check_timeline_event_limit(
      auth.uid(), 
      wedding_timeline.wedding_id, 
      COALESCE(wedding_timeline.event_type, 'regular')
    )
  );

-- Vendors table: Add limit check to INSERT policy
DROP POLICY IF EXISTS "Users can insert vendors for their weddings" ON vendors;

CREATE POLICY "Users can insert vendors for their weddings"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
    AND check_vendor_limit(auth.uid(), vendors.wedding_id)
  );

-- Add helpful comments
COMMENT ON POLICY "Users can insert guests for their weddings" ON guests IS 'Allows INSERT with guest limit check (free: 40, premium: unlimited)';
COMMENT ON POLICY "Users can insert budget items for their weddings" ON budget_items IS 'Allows INSERT with budget item limit check (free: 15, premium: unlimited)';
COMMENT ON POLICY "Users can insert timeline events for their weddings" ON wedding_timeline IS 'Allows INSERT with event limit check (free: 3+2, premium: unlimited)';
COMMENT ON POLICY "Users can insert vendors for their weddings" ON vendors IS 'Allows INSERT with vendor limit check (free: 5, premium: unlimited)';