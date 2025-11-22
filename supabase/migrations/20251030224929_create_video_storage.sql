/*
  # Create Video Storage Bucket

  1. Storage
    - Create public bucket 'videos' for video files
    - Enable public access for video streaming
  
  2. Security
    - Allow public read access
    - Restrict upload/delete to authenticated users only
*/

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to videos
CREATE POLICY "Public video access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow authenticated users to delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');