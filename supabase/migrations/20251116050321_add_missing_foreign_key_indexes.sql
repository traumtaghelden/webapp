/*
  # Add Missing Foreign Key Indexes for Performance

  ## Overview
  This migration adds missing indexes on foreign key columns to improve query performance.
  Only adds indexes that don't already exist based on current schema analysis.

  ## Indexes Added
  
  ### Budget System
  - budget_attachments(uploaded_by) - FK to user_profiles
  - budget_history(changed_by) - FK to user_profiles
  - budget_items(budget_category_id) - FK to budget_categories

  ### Task System
  - task_attachments(uploaded_by) - FK to user_profiles
  - task_comments(user_id) - FK to user_profiles
  - tasks(assigned_to) - FK to user_profiles
  - tasks(vendor_id) - FK to vendors

  ### Vendor System
  - vendor_activity_log(user_id) - FK to user_profiles (for logging who made changes)
  - vendor_attachments(uploaded_by) - FK to user_profiles

  ### Location System
  - location_attachments(uploaded_by) - FK to user_profiles

  ### Timeline System
  - timeline_block_subtasks(assigned_to) - FK to user_profiles
  - wedding_day_checklist(assigned_to) - FK to user_profiles
  - wedding_day_packing_list(assigned_to) - FK to user_profiles
  - wedding_day_vendors(vendor_id) - FK to vendors
  - wedding_timeline(assigned_to) - FK to user_profiles

  ### Recurring Tasks
  - recurring_tasks(assigned_to) - FK to user_profiles

  ### GDPR System
  - data_deletion_requests(user_id) - FK to user_profiles
  - gdpr_operation_log(user_id) - FK to user_profiles

  ## Performance Impact
  - Significantly faster JOIN operations on foreign keys
  - Improved query planning for lookups
  - Better support for cascading operations
  - Reduced sequential scans

  ## Notes
  - All indexes use IF NOT EXISTS to prevent errors
  - Index names follow convention: idx_<table>_<column>
*/

-- Budget System Indexes
CREATE INDEX IF NOT EXISTS idx_budget_attachments_uploaded_by 
  ON budget_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_budget_history_changed_by 
  ON budget_history(changed_by);

CREATE INDEX IF NOT EXISTS idx_budget_items_budget_category_id 
  ON budget_items(budget_category_id);

-- Task System Indexes
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by 
  ON task_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_task_comments_user_id 
  ON task_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
  ON tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tasks_vendor_id 
  ON tasks(vendor_id);

-- Vendor System Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_activity_log_user_id 
  ON vendor_activity_log(user_id);

CREATE INDEX IF NOT EXISTS idx_vendor_attachments_uploaded_by 
  ON vendor_attachments(uploaded_by);

-- Location System Indexes
CREATE INDEX IF NOT EXISTS idx_location_attachments_uploaded_by 
  ON location_attachments(uploaded_by);

-- Timeline System Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_block_subtasks_assigned_to 
  ON timeline_block_subtasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_wedding_day_checklist_assigned_to 
  ON wedding_day_checklist(assigned_to);

CREATE INDEX IF NOT EXISTS idx_wedding_day_packing_list_assigned_to 
  ON wedding_day_packing_list(assigned_to);

CREATE INDEX IF NOT EXISTS idx_wedding_day_vendors_vendor_id 
  ON wedding_day_vendors(vendor_id);

CREATE INDEX IF NOT EXISTS idx_wedding_timeline_assigned_to 
  ON wedding_timeline(assigned_to);

-- Recurring Tasks Index
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_assigned_to 
  ON recurring_tasks(assigned_to);

-- GDPR System Indexes
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id 
  ON data_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_gdpr_operation_log_user_id 
  ON gdpr_operation_log(user_id);