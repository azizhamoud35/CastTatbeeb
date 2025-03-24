/*
  # Add image support to broadcasts

  1. Changes
    - Add `image_url` column to broadcasts table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'broadcasts' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE broadcasts 
    ADD COLUMN image_url text;
  END IF;
END $$;