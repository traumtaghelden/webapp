/*
  # Fix budget_history cascade delete constraint
  
  1. Changes
    - Drop existing budget_history foreign key constraint
    - Recreate with ON DELETE CASCADE to allow proper deletion
  
  2. Security
    - Maintains RLS policies
    - Allows cascade deletes to work properly
*/

-- Drop the existing foreign key constraint
ALTER TABLE budget_history 
DROP CONSTRAINT IF EXISTS budget_history_budget_item_id_fkey;

-- Recreate with CASCADE delete
ALTER TABLE budget_history
ADD CONSTRAINT budget_history_budget_item_id_fkey 
FOREIGN KEY (budget_item_id) 
REFERENCES budget_items(id) 
ON DELETE CASCADE;
