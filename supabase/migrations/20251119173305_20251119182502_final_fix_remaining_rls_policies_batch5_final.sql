/*
  # Fix RLS Auth Performance - Batch 5 (Final Corrected)
  
  1. Optimization
    - Fix auth.uid() performance issues in RLS policies by using (SELECT auth.uid())
    - Tables covered: admin_audit_log, admin_support_notes, vendor_attachments, vendor_activity_log, vendor_event_assignments
  
  2. Security
    - Maintains existing security model while improving performance
    - Admin policies check user_role = 'admin'
    - Vendor-related policies check wedding ownership
*/

-- admin_audit_log policies
DROP POLICY IF EXISTS "Admins can view all activity logs" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can insert activity logs" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_audit_log;

CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.user_role = 'admin'
    )
  );

-- admin_support_notes policies
DROP POLICY IF EXISTS "Admins can view all support notes" ON admin_support_notes;
DROP POLICY IF EXISTS "Admins can insert support notes" ON admin_support_notes;
DROP POLICY IF EXISTS "Admins can update support notes" ON admin_support_notes;
DROP POLICY IF EXISTS "Admins can delete support notes" ON admin_support_notes;

CREATE POLICY "Admins can view all support notes"
  ON admin_support_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can insert support notes"
  ON admin_support_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can update support notes"
  ON admin_support_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.user_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can delete support notes"
  ON admin_support_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.user_role = 'admin'
    )
  );

-- vendor_attachments policies
DROP POLICY IF EXISTS "Users can view vendor_attachments for their wedding" ON vendor_attachments;
DROP POLICY IF EXISTS "Users can insert vendor_attachments for their wedding" ON vendor_attachments;
DROP POLICY IF EXISTS "Users can update vendor_attachments for their wedding" ON vendor_attachments;
DROP POLICY IF EXISTS "Users can delete vendor_attachments for their wedding" ON vendor_attachments;

CREATE POLICY "Users can view vendor_attachments for their wedding"
  ON vendor_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_attachments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert vendor_attachments for their wedding"
  ON vendor_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_attachments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update vendor_attachments for their wedding"
  ON vendor_attachments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_attachments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_attachments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete vendor_attachments for their wedding"
  ON vendor_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_attachments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- vendor_activity_log policies
DROP POLICY IF EXISTS "Users can view vendor_activity_log for their wedding" ON vendor_activity_log;
DROP POLICY IF EXISTS "Users can insert vendor_activity_log for their wedding" ON vendor_activity_log;

CREATE POLICY "Users can view vendor_activity_log for their wedding"
  ON vendor_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_activity_log.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert vendor_activity_log for their wedding"
  ON vendor_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_activity_log.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- vendor_event_assignments policies
DROP POLICY IF EXISTS "Users can view vendor_event_assignments for their wedding" ON vendor_event_assignments;
DROP POLICY IF EXISTS "Users can insert vendor_event_assignments for their wedding" ON vendor_event_assignments;
DROP POLICY IF EXISTS "Users can update vendor_event_assignments for their wedding" ON vendor_event_assignments;
DROP POLICY IF EXISTS "Users can delete vendor_event_assignments for their wedding" ON vendor_event_assignments;

CREATE POLICY "Users can view vendor_event_assignments for their wedding"
  ON vendor_event_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_event_assignments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert vendor_event_assignments for their wedding"
  ON vendor_event_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_event_assignments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update vendor_event_assignments for their wedding"
  ON vendor_event_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_event_assignments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_event_assignments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete vendor_event_assignments for their wedding"
  ON vendor_event_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN weddings ON weddings.id = vendors.wedding_id
      WHERE vendors.id = vendor_event_assignments.vendor_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );
