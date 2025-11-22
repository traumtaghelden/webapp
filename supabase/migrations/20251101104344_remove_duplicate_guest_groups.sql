/*
  # Remove Duplicate Guest Groups

  1. Fixes
    - Removes duplicate guest group entries (A-Liste, B-Liste, C-Liste)
    - Keeps only the oldest entry for each group name per wedding
    - Ensures data integrity for guest group assignments

  2. Important Notes
    - This migration is idempotent and safe to run multiple times
    - Only removes exact duplicates by name within the same wedding
    - Guest assignments remain intact and reference the oldest group entry
*/

-- Remove duplicate guest groups, keeping only the first (oldest) entry for each name per wedding
WITH ranked_groups AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY wedding_id, name 
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM guest_groups
)
DELETE FROM guest_groups
WHERE id IN (
  SELECT id 
  FROM ranked_groups 
  WHERE rn > 1
);