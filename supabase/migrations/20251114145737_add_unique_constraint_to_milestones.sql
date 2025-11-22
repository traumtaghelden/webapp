/*
  # Add Unique Constraint to Hero Journey Milestones

  1. Changes
    - Add UNIQUE constraint to prevent duplicate milestones
    - Ensures each wedding can only have one milestone of each type
  
  2. Security
    - No changes to RLS policies
*/

-- Add unique constraint to prevent duplicate milestones
ALTER TABLE hero_journey_milestones
ADD CONSTRAINT hero_journey_milestones_wedding_milestone_unique 
UNIQUE (wedding_id, milestone_type);
