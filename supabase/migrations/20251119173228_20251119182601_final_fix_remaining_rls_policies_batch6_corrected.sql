/*
  # Fix RLS Auth Performance - Batch 6 (Corrected - Final)
  
  1. Optimization
    - Fix auth.uid() performance issues in RLS policies by using (SELECT auth.uid())
    - Tables covered: task_attachments, task_comments, wedding_team_roles, user_profiles
  
  2. Security
    - Maintains existing security model while improving performance
    - Each policy properly checks user ownership
    - Admin policies use user_role = 'admin'
*/

-- task_attachments policies
DROP POLICY IF EXISTS "Users can view task_attachments for their wedding" ON task_attachments;
DROP POLICY IF EXISTS "Users can insert task_attachments for their wedding" ON task_attachments;
DROP POLICY IF EXISTS "Users can delete task_attachments for their wedding" ON task_attachments;

CREATE POLICY "Users can view task_attachments for their wedding"
  ON task_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_attachments.task_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert task_attachments for their wedding"
  ON task_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_attachments.task_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete task_attachments for their wedding"
  ON task_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_attachments.task_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- task_comments policies
DROP POLICY IF EXISTS "Users can view task_comments for their wedding" ON task_comments;
DROP POLICY IF EXISTS "Users can insert task_comments for their wedding" ON task_comments;
DROP POLICY IF EXISTS "Users can update task_comments for their wedding" ON task_comments;
DROP POLICY IF EXISTS "Users can delete task_comments for their wedding" ON task_comments;

CREATE POLICY "Users can view task_comments for their wedding"
  ON task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_comments.task_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert task_comments for their wedding"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_comments.task_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update task_comments for their wedding"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_comments.task_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_comments.task_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete task_comments for their wedding"
  ON task_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN weddings ON weddings.id = tasks.wedding_id
      WHERE tasks.id = task_comments.task_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- wedding_team_roles policies
DROP POLICY IF EXISTS "Users can view wedding_team_roles for their wedding" ON wedding_team_roles;
DROP POLICY IF EXISTS "Users can insert wedding_team_roles for their wedding" ON wedding_team_roles;
DROP POLICY IF EXISTS "Users can update wedding_team_roles for their wedding" ON wedding_team_roles;
DROP POLICY IF EXISTS "Users can delete wedding_team_roles for their wedding" ON wedding_team_roles;

CREATE POLICY "Users can view wedding_team_roles for their wedding"
  ON wedding_team_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert wedding_team_roles for their wedding"
  ON wedding_team_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update wedding_team_roles for their wedding"
  ON wedding_team_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete wedding_team_roles for their wedding"
  ON wedding_team_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_team_roles.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- user_profiles policies (use user_role = 'admin' not is_admin)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
      AND up.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
      AND up.user_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
      AND up.user_role = 'admin'
    )
  );
