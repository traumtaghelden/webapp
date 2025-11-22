/*
  # Drop Old Timeline System

  1. Cleanup
    - Drop `wedding_day_timeline_items` table (replaced by `timeline_block_subtasks`)
    - This table is no longer used in the new system
  
  2. Note
    - `timeline_block_subtasks` is now the single source of truth for sub-timeline items
    - All references to `wedding_day_timeline_items` have been removed from the codebase
*/

-- Drop the old table
DROP TABLE IF EXISTS wedding_day_timeline_items CASCADE;
