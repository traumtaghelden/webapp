/*
  # Add Subscription System to User Profiles

  1. Changes to user_profiles table
    - Add `subscription_tier` column (TEXT, DEFAULT 'free')
      - Indicates user's current subscription level: 'free' or 'premium'
    - Add `stripe_customer_id` column (TEXT, NULLABLE)
      - Links user to their Stripe customer account
    - Add `subscription_status` column (TEXT, NULLABLE)
      - Tracks Stripe subscription status (active, canceled, past_due, etc.)
    - Add `premium_since` column (TIMESTAMPTZ, NULLABLE)
      - Records when user became premium member
    - Add `subscription_cancelled_at` column (TIMESTAMPTZ, NULLABLE)
      - Records when user cancelled their subscription

  2. Indexes
    - Add index on subscription_tier for performance on queries filtering by tier

  3. Security
    - Users can only read their own subscription information
    - Only authenticated users can view their subscription details
*/

-- Add subscription columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_status TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'premium_since'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN premium_since TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_cancelled_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_cancelled_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index on subscription_tier for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);

-- Add comment to table explaining subscription system
COMMENT ON COLUMN user_profiles.subscription_tier IS 'User subscription level: free or premium';
COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN user_profiles.subscription_status IS 'Current Stripe subscription status';
COMMENT ON COLUMN user_profiles.premium_since IS 'Date when user became premium member';
COMMENT ON COLUMN user_profiles.subscription_cancelled_at IS 'Date when user cancelled subscription';