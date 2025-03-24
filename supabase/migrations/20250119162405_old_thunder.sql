/*
  # Create storage bucket for broadcast images

  1. Changes
    - Create storage bucket for broadcast images
    - Set up storage policies for authenticated users
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name)
VALUES ('broadcast-images', 'broadcast-images')
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload broadcast images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'broadcast-images'
  AND auth.role() = 'authenticated'
);

-- Policy to allow public access to read files
CREATE POLICY "Public access to broadcast images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'broadcast-images');

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own broadcast images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'broadcast-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);