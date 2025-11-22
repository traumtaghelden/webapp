/*
  # Add Onboarding Completed Flag to User Profiles

  1. Changes
    - Add `onboarding_completed` boolean column to `user_profiles` table
    - Default value is `false` for new profiles
    - This flag explicitly tracks whether a user has completed the onboarding process
  
  2. Purpose
    - Provides a clear, explicit indicator of onboarding completion status
    - Prevents users from being redirected to onboarding after they've already completed it
    - Improves authentication flow reliability
  
  3. Notes
    - Existing users without this flag will be treated as not having completed onboarding
    - The flag should be set to `true` only after successful onboarding completion
*/

-- Add onboarding_completed column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_completed boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Update existing profiles that have both event_name and a wedding record to mark as completed
UPDATE user_profiles
SET onboarding_completed = true
WHERE event_name IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM weddings WHERE weddings.user_id = user_profiles.id
  );
