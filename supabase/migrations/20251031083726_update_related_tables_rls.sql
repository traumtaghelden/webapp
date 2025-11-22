/*
  # Update RLS policies for related tables

  1. Changes
    - Update RLS policies for tasks, budget_items, guests, and team_members
    - All policies now check if user owns the wedding via weddings.user_id
  
  2. Security
    - Users can only access data for weddings they own
    - Prevents unauthorized access to other users' data
*/

DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

CREATE POLICY "Users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = tasks.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete budget items" ON budget_items;

CREATE POLICY "Users can view budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view guests" ON guests;
DROP POLICY IF EXISTS "Users can insert guests" ON guests;
DROP POLICY IF EXISTS "Users can update guests" ON guests;
DROP POLICY IF EXISTS "Users can delete guests" ON guests;

CREATE POLICY "Users can view guests"
  ON guests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert guests"
  ON guests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update guests"
  ON guests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete guests"
  ON guests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;

CREATE POLICY "Users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = team_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = team_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = team_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = team_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = team_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );