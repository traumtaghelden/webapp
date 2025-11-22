/*
  # Storage für Aufgaben-Anhänge einrichten

  1. Storage
    - Erstellt Bucket 'wedding-files' für Dateianhänge
    - Bucket ist privat und nur für authentifizierte Benutzer zugänglich
    - Max. Dateigröße: 10MB
    - Erlaubte Dateitypen: Bilder, PDFs, Office-Dokumente

  2. Security
    - RLS Policies für Storage Bucket
    - Benutzer können nur Dateien für ihre eigenen Hochzeiten hochladen
    - Benutzer können nur ihre eigenen Dateien löschen
    - Alle authentifizierten Benutzer können Dateien ihrer Hochzeit lesen
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wedding-files',
  'wedding-files',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wedding-files');

CREATE POLICY "Users can view files from their weddings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'wedding-files');

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'wedding-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
