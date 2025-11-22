/*
  # Budget Attachments Storage

  ## Bucket Erstellung
  - Erstellt einen Storage-Bucket für Budget-Anhänge (Rechnungen, Verträge, etc.)
  
  ## Sicherheit
  - RLS Policies für authenticated users
  - Nur Besitzer der Hochzeit können Dateien hochladen/löschen
  - Öffentliches Lesen für authentifizierte Benutzer mit Zugang zur Hochzeit
*/

-- Storage Bucket für Budget-Anhänge erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('budget-attachments', 'budget-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Benutzer können Dateien für ihre Hochzeit hochladen
CREATE POLICY "Users can upload budget attachments for their wedding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'budget-attachments' AND
  auth.uid() IN (
    SELECT weddings.user_id FROM weddings
    JOIN budget_items ON budget_items.wedding_id = weddings.id
    WHERE budget_items.id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Benutzer können ihre Budget-Anhänge ansehen
CREATE POLICY "Users can view budget attachments for their wedding"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'budget-attachments' AND
  auth.uid() IN (
    SELECT weddings.user_id FROM weddings
    JOIN budget_items ON budget_items.wedding_id = weddings.id
    WHERE budget_items.id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Benutzer können ihre Budget-Anhänge löschen
CREATE POLICY "Users can delete budget attachments for their wedding"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'budget-attachments' AND
  auth.uid() IN (
    SELECT weddings.user_id FROM weddings
    JOIN budget_items ON budget_items.wedding_id = weddings.id
    WHERE budget_items.id::text = (storage.foldername(name))[1]
  )
);
