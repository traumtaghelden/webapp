/*
  # Add RLS Policies for Timeline Block Tables

  1. Purpose
    - Add missing RLS policies for timeline_block_checklist and timeline_block_items
    - These tables reference timeline_event_id which no longer exists
    - Tables appear to be legacy/unused, so policies will block all access

  2. Tables Updated
    - timeline_block_checklist (restrictive policies)
    - timeline_block_items (restrictive policies)

  3. Note
    - These tables reference non-existent timeline_events
    - Consider dropping these tables if they're not used
*/

-- timeline_block_checklist restrictive policies (table appears unused/legacy)
CREATE POLICY "No access to legacy timeline_block_checklist"
  ON timeline_block_checklist
  FOR ALL
  TO authenticated
  USING (false);

-- timeline_block_items restrictive policies (table appears unused/legacy)
CREATE POLICY "No access to legacy timeline_block_items"
  ON timeline_block_items
  FOR ALL
  TO authenticated
  USING (false);
