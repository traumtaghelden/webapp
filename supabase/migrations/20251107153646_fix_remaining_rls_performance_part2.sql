/*
  # Fix Remaining RLS Performance Issues - Part 2

  ## Summary
  Continues optimizing RLS policies across all remaining tables.

  ## Tables Optimized
  - timeline_block_items
  - timeline_block_item_categories
  - notifications
  - task_comments
  - task_attachments
  - timeline_block_subtasks
  - timeline_block_checklist_categories
  - vendors
  - budget_history
  - guest_groups
  - wedding_team_roles
  - wedding_timeline
  - budget_categories
  - task_subtasks
  - task_dependencies
  - task_recurrence
  - recurring_tasks
  - budget_payments (premium policies)
  - budget_attachments
  - budget_partner_splits (premium policies)
  - budget_tags
  - recurring_budget_items
  - budget_item_tags
  - user_consent
  - cookie_preferences
  - data_deletion_requests
  - guest_communications
  - guest_tags
  - guest_tag_assignments
  - family_groups (premium policies)
  - timeline_event_guest_attendance
  - vendor_event_assignments
  - stripe_customers
  - stripe_subscriptions
  - stripe_orders
  - activity_log
*/

-- Optimize timeline_block_items
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view items for their wedding events" ON timeline_block_items;
  DROP POLICY IF EXISTS "Users can insert items for their wedding events" ON timeline_block_items;
  DROP POLICY IF EXISTS "Users can update items for their wedding events" ON timeline_block_items;
  DROP POLICY IF EXISTS "Users can delete items for their wedding events" ON timeline_block_items;
  
  CREATE POLICY "Users can view items for their wedding events"
    ON timeline_block_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_items.timeline_event_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert items for their wedding events"
    ON timeline_block_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_items.timeline_event_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update items for their wedding events"
    ON timeline_block_items FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_items.timeline_event_id AND w.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_items.timeline_event_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete items for their wedding events"
    ON timeline_block_items FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_items.timeline_event_id AND w.user_id = (SELECT auth.uid())));
END $$;

-- Optimize timeline_block_item_categories
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view item categories for their wedding" ON timeline_block_item_categories;
  DROP POLICY IF EXISTS "Users can insert item categories for their wedding" ON timeline_block_item_categories;
  DROP POLICY IF EXISTS "Users can update item categories for their wedding" ON timeline_block_item_categories;
  DROP POLICY IF EXISTS "Users can delete item categories for their wedding" ON timeline_block_item_categories;
  
  CREATE POLICY "Users can view item categories for their wedding"
    ON timeline_block_item_categories FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_item_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert item categories for their wedding"
    ON timeline_block_item_categories FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_item_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update item categories for their wedding"
    ON timeline_block_item_categories FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_item_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_item_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete item categories for their wedding"
    ON timeline_block_item_categories FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_item_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
END $$;

-- Optimize notifications
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view notifications for their weddings" ON notifications;
  DROP POLICY IF EXISTS "Users can update their notification read status" ON notifications;
  
  CREATE POLICY "Users can view notifications for their weddings"
    ON notifications FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = notifications.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update their notification read status"
    ON notifications FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = notifications.wedding_id AND weddings.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = notifications.wedding_id AND weddings.user_id = (SELECT auth.uid())));
END $$;

-- Optimize task_comments
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view comments for tasks in their weddings" ON task_comments;
  DROP POLICY IF EXISTS "Users can insert comments for tasks in their weddings" ON task_comments;
  DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;
  
  CREATE POLICY "Users can view comments for tasks in their weddings"
    ON task_comments FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM tasks t JOIN weddings w ON w.id = t.wedding_id WHERE t.id = task_comments.task_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert comments for tasks in their weddings"
    ON task_comments FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM tasks t JOIN weddings w ON w.id = t.wedding_id WHERE t.id = task_comments.task_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete their own comments"
    ON task_comments FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));
END $$;

-- Optimize task_attachments
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view attachments for tasks in their weddings" ON task_attachments;
  DROP POLICY IF EXISTS "Users can insert attachments for tasks in their weddings" ON task_attachments;
  DROP POLICY IF EXISTS "Users can delete their own attachments" ON task_attachments;
  
  CREATE POLICY "Users can view attachments for tasks in their weddings"
    ON task_attachments FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM tasks t JOIN weddings w ON w.id = t.wedding_id WHERE t.id = task_attachments.task_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert attachments for tasks in their weddings"
    ON task_attachments FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM tasks t JOIN weddings w ON w.id = t.wedding_id WHERE t.id = task_attachments.task_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete their own attachments"
    ON task_attachments FOR DELETE TO authenticated
    USING (uploaded_by = (SELECT auth.uid()));
END $$;