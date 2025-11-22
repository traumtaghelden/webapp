/*
  # Add user_id to weddings table

  1. Changes
    - Add `user_id` column to `weddings` table (references auth.users)
    - Add index for faster lookups by user_id
  
  2. Security
    - Update RLS policies to use user_id instead of wedding_id matching
    - Users can only access their own weddings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE weddings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_weddings_user_id ON weddings(user_id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can update own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can delete own weddings" ON weddings;

CREATE POLICY "Users can view own weddings"
  ON weddings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weddings"
  ON weddings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weddings"
  ON weddings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weddings"
  ON weddings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);