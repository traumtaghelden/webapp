/*
  # Fix Budget Attachments Schema

  1. Changes
    - Rename `file_path` to `file_url` for consistency with code
    - Add missing columns that the code expects
    - Add `attachment_type` and `uploaded_by` fields

  2. Notes
    - File uploads require the storage bucket to be created manually in Supabase Dashboard
    - Bucket name: budget-attachments
    - Access: Private with RLS policies
*/

-- Add missing columns to budget_attachments if they don't exist
DO $$
BEGIN
  -- Rename file_path to file_url if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_attachments' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE budget_attachments RENAME COLUMN file_path TO file_url;
  END IF;

  -- Add file_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_attachments' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE budget_attachments ADD COLUMN file_url text NOT NULL DEFAULT '';
  END IF;

  -- Add attachment_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_attachments' AND column_name = 'attachment_type'
  ) THEN
    ALTER TABLE budget_attachments ADD COLUMN attachment_type text DEFAULT 'other';
  END IF;

  -- Add uploaded_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_attachments' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE budget_attachments ADD COLUMN uploaded_by uuid REFERENCES auth.users(id);
  END IF;
END $$;