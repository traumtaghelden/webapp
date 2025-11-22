/*
  # Remove Duplicate Database Indexes

  ## Summary
  Removes duplicate indexes that were identified by the database linter.
  Keeping duplicate indexes wastes storage and slows down write operations.

  ## Changes Made
  1. Drops duplicate indexes on vendor_activity_log table
  2. Drops duplicate indexes on vendor_payments table
  3. Keeps the most appropriately named index from each duplicate pair

  ## Performance Impact
  - Reduces storage usage
  - Improves INSERT/UPDATE performance on affected tables
  - No impact on query performance (identical indexes being removed)
*/

-- Remove duplicate indexes on vendor_activity_log
-- Keep idx_vendor_activity_log_vendor_id, drop idx_vendor_activity_vendor_id
DROP INDEX IF EXISTS idx_vendor_activity_vendor_id;

-- Keep idx_vendor_activity_log_created_at, drop idx_vendor_activity_created_at
DROP INDEX IF EXISTS idx_vendor_activity_created_at;

-- Remove duplicate indexes on vendor_payments
-- Keep idx_vendor_payments_vendor_id, drop idx_vendor_payments_vendor
DROP INDEX IF EXISTS idx_vendor_payments_vendor;