/*
  # Add Unique Constraint on weddings.user_id

  1. Purpose
    - Enforce business rule: One wedding per user
    - Prevent duplicate weddings

  2. Changes
    - Add UNIQUE constraint on weddings.user_id
    - Ensures database-level enforcement

  3. Impact
    - Users can only create one wedding
    - Attempts to create second wedding will fail with unique constraint error
*/

-- Add unique constraint
ALTER TABLE weddings 
ADD CONSTRAINT weddings_user_id_unique UNIQUE (user_id);
