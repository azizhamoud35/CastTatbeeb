/*
  # Add status field to broadcasts table

  1. Changes
    - Add `status` column to `broadcasts` table with values:
      - 'active' (default)
      - 'paused'

  2. Security
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'broadcasts' AND column_name = 'status'
  ) THEN
    ALTER TABLE broadcasts 
    ADD COLUMN status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'paused'));
  END IF;
END $$;