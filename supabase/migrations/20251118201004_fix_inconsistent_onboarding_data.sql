/*
  # Fix inconsistent onboarding data
  
  1. Changes
    - Reset onboarding_completed flag for users without wedding data
    - This allows them to complete onboarding properly
  
  2. Security
    - Only affects users in inconsistent state
*/

-- Reset onboarding_completed for users without wedding data
UPDATE user_profiles
SET onboarding_completed = false
WHERE onboarding_completed = true
  AND id NOT IN (SELECT user_id FROM weddings WHERE user_id IS NOT NULL);
