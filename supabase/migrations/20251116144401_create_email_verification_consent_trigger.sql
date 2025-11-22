/*
  # Email Verification Consent Tracking

  1. Functions
    - `log_email_verification_consent()` - Automatically logs consent when email is verified

  2. Triggers
    - Trigger on auth.users when email_confirmed_at is set
    - Creates consent record in user_consent table

  3. Security
    - Function runs with security definer for proper permissions
    - Only creates consent if none exists for this user and type
*/

-- Function to log email verification as consent
CREATE OR REPLACE FUNCTION log_email_verification_consent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if email was just confirmed (changed from NULL to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if consent record already exists
    IF NOT EXISTS (
      SELECT 1 FROM user_consent
      WHERE user_id = NEW.id
      AND consent_type = 'email_verification'
    ) THEN
      -- Create consent record for email verification
      INSERT INTO user_consent (
        user_id,
        consent_type,
        consent_given,
        consent_version,
        consented_at
      ) VALUES (
        NEW.id,
        'email_verification',
        true,
        'v1.0',
        NEW.email_confirmed_at
      );

      RAISE NOTICE 'Email verification consent logged for user %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS log_email_verification_trigger ON auth.users;

-- Create trigger on auth.users for email confirmation
CREATE TRIGGER log_email_verification_trigger
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION log_email_verification_consent();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_email_verification_consent() TO authenticated;
GRANT EXECUTE ON FUNCTION log_email_verification_consent() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION log_email_verification_consent() IS 'Automatically creates a consent record when a user confirms their email address for GDPR compliance';
