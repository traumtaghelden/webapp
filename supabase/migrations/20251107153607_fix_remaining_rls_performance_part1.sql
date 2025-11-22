/*
  # Fix Remaining RLS Performance Issues - Part 1

  ## Summary
  Optimizes remaining RLS policies with (select auth.uid()) wrapper
  and adds missing indexes for performance.

  ## Changes Made
  1. Add missing index for guest_communications.created_by
  2. Optimize task_templates, timeline tables, notifications, task_comments, task_attachments

  ## Tables Optimized
  - task_templates
  - timeline_block_checklist
  - timeline_block_items  
  - timeline_block_item_categories
  - notifications
  - task_comments
  - task_attachments
  - timeline_block_subtasks
  - timeline_block_checklist_categories
*/

-- Add missing foreign key index
CREATE INDEX IF NOT EXISTS idx_guest_communications_created_by 
  ON guest_communications(created_by);

-- Optimize task_templates policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view public templates and their own templates" ON task_templates;
  DROP POLICY IF EXISTS "Users can insert their own templates" ON task_templates;
  DROP POLICY IF EXISTS "Users can update their own templates" ON task_templates;
  DROP POLICY IF EXISTS "Users can delete their own templates" ON task_templates;
  
  CREATE POLICY "Users can view public templates and their own templates"
    ON task_templates FOR SELECT
    TO authenticated
    USING (is_public = true OR created_by = (SELECT auth.uid()));
  
  CREATE POLICY "Users can insert their own templates"
    ON task_templates FOR INSERT
    TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));
  
  CREATE POLICY "Users can update their own templates"
    ON task_templates FOR UPDATE
    TO authenticated
    USING (created_by = (SELECT auth.uid()))
    WITH CHECK (created_by = (SELECT auth.uid()));
  
  CREATE POLICY "Users can delete their own templates"
    ON task_templates FOR DELETE
    TO authenticated
    USING (created_by = (SELECT auth.uid()));
END $$;

-- Optimize timeline_block_checklist policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view checklist items for their wedding events" ON timeline_block_checklist;
  DROP POLICY IF EXISTS "Users can insert checklist items for their wedding events" ON timeline_block_checklist;
  DROP POLICY IF EXISTS "Users can update checklist items for their wedding events" ON timeline_block_checklist;
  DROP POLICY IF EXISTS "Users can delete checklist items for their wedding events" ON timeline_block_checklist;
  
  CREATE POLICY "Users can view checklist items for their wedding events"
    ON timeline_block_checklist FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM wedding_timeline wt
        JOIN weddings w ON w.id = wt.wedding_id
        WHERE wt.id = timeline_block_checklist.timeline_event_id
        AND w.user_id = (SELECT auth.uid())
      )
    );
  
  CREATE POLICY "Users can insert checklist items for their wedding events"
    ON timeline_block_checklist FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM wedding_timeline wt
        JOIN weddings w ON w.id = wt.wedding_id
        WHERE wt.id = timeline_block_checklist.timeline_event_id
        AND w.user_id = (SELECT auth.uid())
      )
    );
  
  CREATE POLICY "Users can update checklist items for their wedding events"
    ON timeline_block_checklist FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM wedding_timeline wt
        JOIN weddings w ON w.id = wt.wedding_id
        WHERE wt.id = timeline_block_checklist.timeline_event_id
        AND w.user_id = (SELECT auth.uid())
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM wedding_timeline wt
        JOIN weddings w ON w.id = wt.wedding_id
        WHERE wt.id = timeline_block_checklist.timeline_event_id
        AND w.user_id = (SELECT auth.uid())
      )
    );
  
  CREATE POLICY "Users can delete checklist items for their wedding events"
    ON timeline_block_checklist FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM wedding_timeline wt
        JOIN weddings w ON w.id = wt.wedding_id
        WHERE wt.id = timeline_block_checklist.timeline_event_id
        AND w.user_id = (SELECT auth.uid())
      )
    );
END $$;