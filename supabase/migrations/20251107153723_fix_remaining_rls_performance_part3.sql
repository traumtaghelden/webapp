/*
  # Fix Remaining RLS Performance Issues - Part 3

  ## Summary
  Continues optimizing remaining tables with SELECT auth.uid() wrapper.

  ## Tables Optimized (continued)
  - timeline_block_subtasks
  - timeline_block_checklist_categories
  - vendors
  - budget_history
  - guest_groups
  - wedding_team_roles
  - wedding_timeline
  - budget_categories
*/

-- Optimize timeline_block_subtasks
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view subtasks for their wedding events" ON timeline_block_subtasks;
  DROP POLICY IF EXISTS "Users can insert subtasks for their wedding events" ON timeline_block_subtasks;
  DROP POLICY IF EXISTS "Users can update subtasks for their wedding events" ON timeline_block_subtasks;
  DROP POLICY IF EXISTS "Users can delete subtasks for their wedding events" ON timeline_block_subtasks;
  
  CREATE POLICY "Users can view subtasks for their wedding events"
    ON timeline_block_subtasks FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_subtasks.timeline_event_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert subtasks for their wedding events"
    ON timeline_block_subtasks FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_subtasks.timeline_event_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update subtasks for their wedding events"
    ON timeline_block_subtasks FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_subtasks.timeline_event_id AND w.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_subtasks.timeline_event_id AND w.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete subtasks for their wedding events"
    ON timeline_block_subtasks FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM wedding_timeline wt JOIN weddings w ON w.id = wt.wedding_id WHERE wt.id = timeline_block_subtasks.timeline_event_id AND w.user_id = (SELECT auth.uid())));
END $$;

-- Optimize timeline_block_checklist_categories
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view checklist categories for their wedding" ON timeline_block_checklist_categories;
  DROP POLICY IF EXISTS "Users can insert checklist categories for their wedding" ON timeline_block_checklist_categories;
  DROP POLICY IF EXISTS "Users can update checklist categories for their wedding" ON timeline_block_checklist_categories;
  DROP POLICY IF EXISTS "Users can delete checklist categories for their wedding" ON timeline_block_checklist_categories;
  
  CREATE POLICY "Users can view checklist categories for their wedding"
    ON timeline_block_checklist_categories FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_checklist_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert checklist categories for their wedding"
    ON timeline_block_checklist_categories FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_checklist_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update checklist categories for their wedding"
    ON timeline_block_checklist_categories FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_checklist_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_checklist_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete checklist categories for their wedding"
    ON timeline_block_checklist_categories FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = timeline_block_checklist_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
END $$;

-- Optimize vendors
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view vendors for their weddings" ON vendors;
  DROP POLICY IF EXISTS "Users can insert vendors for their weddings" ON vendors;
  DROP POLICY IF EXISTS "Users can update vendors for their weddings" ON vendors;
  DROP POLICY IF EXISTS "Users can delete vendors for their weddings" ON vendors;
  DROP POLICY IF EXISTS "Enforce vendor limit on insert" ON vendors;
  
  CREATE POLICY "Users can view vendors for their weddings"
    ON vendors FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = vendors.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert vendors for their weddings"
    ON vendors FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = vendors.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update vendors for their weddings"
    ON vendors FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = vendors.wedding_id AND weddings.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = vendors.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete vendors for their weddings"
    ON vendors FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = vendors.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  -- Recreate vendor limit policy with optimization
  CREATE POLICY "Enforce vendor limit on insert"
    ON vendors FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = (SELECT auth.uid()) AND user_profiles.subscription_tier = 'premium')
      OR (SELECT COUNT(*) FROM vendors v JOIN weddings w ON v.wedding_id = w.id WHERE w.user_id = (SELECT auth.uid())) < 5
    );
END $$;

-- Optimize budget_history
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view budget history for their weddings" ON budget_history;
  DROP POLICY IF EXISTS "Users can delete budget history for their weddings" ON budget_history;
  
  CREATE POLICY "Users can view budget history for their weddings"
    ON budget_history FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = budget_history.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete budget history for their weddings"
    ON budget_history FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = budget_history.wedding_id AND weddings.user_id = (SELECT auth.uid())));
END $$;

-- Optimize guest_groups
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view groups for their weddings" ON guest_groups;
  DROP POLICY IF EXISTS "Users can insert groups for their weddings" ON guest_groups;
  DROP POLICY IF EXISTS "Users can update groups for their weddings" ON guest_groups;
  DROP POLICY IF EXISTS "Users can delete groups for their weddings" ON guest_groups;
  
  CREATE POLICY "Users can view groups for their weddings"
    ON guest_groups FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_groups.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert groups for their weddings"
    ON guest_groups FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_groups.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update groups for their weddings"
    ON guest_groups FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_groups.wedding_id AND weddings.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_groups.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete groups for their weddings"
    ON guest_groups FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_groups.wedding_id AND weddings.user_id = (SELECT auth.uid())));
END $$;

-- Optimize wedding_team_roles
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own wedding team roles" ON wedding_team_roles;
  DROP POLICY IF EXISTS "Users can insert own wedding team roles" ON wedding_team_roles;
  DROP POLICY IF EXISTS "Users can update own wedding team roles" ON wedding_team_roles;
  DROP POLICY IF EXISTS "Users can delete own wedding team roles" ON wedding_team_roles;
  
  CREATE POLICY "Users can read own wedding team roles"
    ON wedding_team_roles FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_team_roles.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert own wedding team roles"
    ON wedding_team_roles FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_team_roles.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update own wedding team roles"
    ON wedding_team_roles FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_team_roles.wedding_id AND weddings.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_team_roles.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete own wedding team roles"
    ON wedding_team_roles FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_team_roles.wedding_id AND weddings.user_id = (SELECT auth.uid())));
END $$;

-- Optimize wedding_timeline
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view timeline for their weddings" ON wedding_timeline;
  DROP POLICY IF EXISTS "Users can insert timeline events for their weddings" ON wedding_timeline;
  DROP POLICY IF EXISTS "Users can update timeline events for their weddings" ON wedding_timeline;
  DROP POLICY IF EXISTS "Users can delete timeline events for their weddings" ON wedding_timeline;
  
  CREATE POLICY "Users can view timeline for their weddings"
    ON wedding_timeline FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_timeline.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert timeline events for their weddings"
    ON wedding_timeline FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_timeline.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update timeline events for their weddings"
    ON wedding_timeline FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_timeline.wedding_id AND weddings.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_timeline.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete timeline events for their weddings"
    ON wedding_timeline FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = wedding_timeline.wedding_id AND weddings.user_id = (SELECT auth.uid())));
END $$;

-- Optimize budget_categories
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view budget categories for their wedding" ON budget_categories;
  DROP POLICY IF EXISTS "Users can insert budget categories for their wedding" ON budget_categories;
  DROP POLICY IF EXISTS "Users can update budget categories for their wedding" ON budget_categories;
  DROP POLICY IF EXISTS "Users can delete budget categories for their wedding" ON budget_categories;
  
  CREATE POLICY "Users can view budget categories for their wedding"
    ON budget_categories FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = budget_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can insert budget categories for their wedding"
    ON budget_categories FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = budget_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can update budget categories for their wedding"
    ON budget_categories FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = budget_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = budget_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
  
  CREATE POLICY "Users can delete budget categories for their wedding"
    ON budget_categories FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = budget_categories.wedding_id AND weddings.user_id = (SELECT auth.uid())));
END $$;