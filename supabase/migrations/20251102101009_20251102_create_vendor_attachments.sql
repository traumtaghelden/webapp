/*
  # Create Vendor Attachments System

  1. New Tables
    - `vendor_attachments`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendors)
      - `file_name` (text)
      - `file_url` (text)
      - `file_size` (bigint) - in bytes
      - `file_type` (text) - MIME type
      - `category` (text) - contract, offer, invoice, communication, other
      - `uploaded_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

  2. Storage
    - Create storage bucket for vendor documents
    - Set up RLS policies for storage

  3. Security
    - Enable RLS on `vendor_attachments` table
    - Add policies for authenticated users

  4. Indexes
    - Index on vendor_id for fast lookups
    - Index on category for filtering
*/

-- Create vendor_attachments table
CREATE TABLE IF NOT EXISTS vendor_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL CHECK (file_size > 0),
  file_type text NOT NULL,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('contract', 'offer', 'invoice', 'communication', 'other')),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_attachments_vendor_id ON vendor_attachments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_attachments_category ON vendor_attachments(category);
CREATE INDEX IF NOT EXISTS idx_vendor_attachments_uploaded_by ON vendor_attachments(uploaded_by);

-- Enable Row Level Security
ALTER TABLE vendor_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own vendor attachments"
  ON vendor_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_attachments.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own vendor attachments"
  ON vendor_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_attachments.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own vendor attachments"
  ON vendor_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_attachments.vendor_id
      AND EXISTS (
        SELECT 1 FROM weddings
        WHERE weddings.id = vendors.wedding_id
        AND weddings.user_id = auth.uid()
      )
    )
  );

-- Create storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-documents',
  'vendor-documents',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload vendor documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own vendor documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vendor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own vendor documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vendor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
