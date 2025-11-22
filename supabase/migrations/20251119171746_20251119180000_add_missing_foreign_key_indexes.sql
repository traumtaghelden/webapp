/*
  # Add Missing Foreign Key Indexes

  1. Purpose
    - Add indexes for all unindexed foreign keys
    - Improves query performance for joins and lookups
    - Prevents table scans on foreign key constraints

  2. Indexes Added
    - admin_support_notes.admin_id
    - guest_communications.created_by
    - guest_tag_assignments.tag_id
    - guests.group_id
    - locations.budget_item_id
    - locations.location_category_id
    - recurring_budget_items.wedding_id
*/

-- Add index for admin_support_notes.admin_id
CREATE INDEX IF NOT EXISTS idx_admin_support_notes_admin_id 
ON admin_support_notes(admin_id);

-- Add index for guest_communications.created_by
CREATE INDEX IF NOT EXISTS idx_guest_communications_created_by 
ON guest_communications(created_by);

-- Add index for guest_tag_assignments.tag_id
CREATE INDEX IF NOT EXISTS idx_guest_tag_assignments_tag_id 
ON guest_tag_assignments(tag_id);

-- Add index for guests.group_id
CREATE INDEX IF NOT EXISTS idx_guests_group_id 
ON guests(group_id);

-- Add index for locations.budget_item_id
CREATE INDEX IF NOT EXISTS idx_locations_budget_item_id 
ON locations(budget_item_id);

-- Add index for locations.location_category_id
CREATE INDEX IF NOT EXISTS idx_locations_location_category_id 
ON locations(location_category_id);

-- Add index for recurring_budget_items.wedding_id
CREATE INDEX IF NOT EXISTS idx_recurring_budget_items_wedding_id 
ON recurring_budget_items(wedding_id);
