/*
  # Make broadcast-images bucket public

  1. Changes
    - Update broadcast-images bucket to be publicly accessible
    - Set public flag to true
*/

UPDATE storage.buckets
SET public = true
WHERE id = 'broadcast-images';