/*
  # Add Missing Foreign Key Indexes for Performance

  ## Purpose
  Adds covering indexes for all unindexed foreign keys to improve query performance
  for join operations and foreign key constraints.

  ## Tables Affected
  - budget_attachments: uploaded_by foreign key
  - budget_categories: parent_category_id foreign key  
  - budget_history: changed_by foreign key
  - budget_items: vendor_id foreign key
  - recurring_budget_items: base_budget_item_id foreign key
  - task_attachments: uploaded_by foreign key
  - task_comments: user_id foreign key
  - wedding_team_roles: wedding_id foreign key

  ## Performance Impact
  - Significantly improves JOIN performance
  - Reduces table scans when querying related records
  - Speeds up foreign key constraint checks
*/

-- Budget attachments: uploaded_by foreign key
CREATE INDEX IF NOT EXISTS idx_budget_attachments_uploaded_by 
ON budget_attachments(uploaded_by);

-- Budget categories: parent_category_id foreign key
CREATE INDEX IF NOT EXISTS idx_budget_categories_parent_category 
ON budget_categories(parent_category_id);

-- Budget history: changed_by foreign key
CREATE INDEX IF NOT EXISTS idx_budget_history_changed_by 
ON budget_history(changed_by);

-- Budget items: vendor_id foreign key
CREATE INDEX IF NOT EXISTS idx_budget_items_vendor_id_fk 
ON budget_items(vendor_id);

-- Recurring budget items: base_budget_item_id foreign key
CREATE INDEX IF NOT EXISTS idx_recurring_budget_items_base 
ON recurring_budget_items(base_budget_item_id);

-- Task attachments: uploaded_by foreign key
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by 
ON task_attachments(uploaded_by);

-- Task comments: user_id foreign key
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id_fk 
ON task_comments(user_id);

-- Wedding team roles: wedding_id foreign key
CREATE INDEX IF NOT EXISTS idx_wedding_team_roles_wedding_fk 
ON wedding_team_roles(wedding_id);