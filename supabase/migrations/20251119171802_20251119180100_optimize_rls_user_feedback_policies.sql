/*
  # Optimize RLS Policies - User Feedback

  1. Purpose
    - Optimize auth.uid() calls in RLS policies
    - Replace auth.uid() with (select auth.uid())
    - Improves query performance at scale

  2. Tables Updated
    - user_feedback (4 policies)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own feedback" ON user_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback via RPC" ON user_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON user_feedback;
DROP POLICY IF EXISTS "Admins can update feedback visibility" ON user_feedback;

-- Recreate with optimized auth checks
CREATE POLICY "Users can view own feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own feedback via RPC"
  ON user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Admins can update feedback visibility"
  ON user_feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
      AND user_role = 'admin'
    )
  );
