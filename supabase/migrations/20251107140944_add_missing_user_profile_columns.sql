/*
  # Add Missing User Profile Columns for Onboarding

  1. Changes
    - Add `event_name` (text, nullable) - Wedding event name from onboarding
    - Add `event_date` (date, nullable) - Wedding date from onboarding  
    - Add `event_type` (text, nullable) - Ceremony type from onboarding
    - Add `onboarding_completed` (boolean, default false) - Tracks onboarding completion

  2. Purpose
    - Fix schema mismatch causing 400 errors during onboarding completion
    - Ensure user_profiles table has all columns required by application code
    - Maintain backward compatibility with existing data

  3. Notes
    - Uses IF NOT EXISTS pattern to safely add columns
    - All new columns are nullable to avoid breaking existing records
    - onboarding_completed defaults to false for safety
*/

-- Add event_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'event_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN event_name text;
  END IF;
END $$;

-- Add event_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN event_date date;
  END IF;
END $$;

-- Add event_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN event_type text;
  END IF;
END $$;

-- Add onboarding_completed column if it doesn't exist
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
  )
  AND onboarding_completed = false;
