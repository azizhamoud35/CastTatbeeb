/*
  # Add unique constraint and improve phone number handling

  1. Changes
    - Add unique constraint to phone_number column
    - Clean up any existing duplicates
    - Preserve broadcast history
    - Add index for better performance

  2. Data Preservation
    - Keeps the most recent contact for each duplicate phone number
    - Updates broadcast references to point to the kept contact
    - Ensures no data loss for broadcast history
*/

-- First, create an index for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number_created 
ON contacts(phone_number, created_at DESC);

-- Drop existing constraint if it exists
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_phone_number_unique;

-- Clean up duplicates and preserve broadcast history
DO $$ 
DECLARE
  r RECORD;
  keep_id uuid;
BEGIN
  -- Process one phone number at a time to maintain data integrity
  FOR r IN (
    SELECT phone_number
    FROM contacts
    GROUP BY phone_number
    HAVING COUNT(*) > 1
  ) LOOP
    -- Find the contact with broadcasts first, if any exist
    SELECT c.id INTO keep_id
    FROM contacts c
    WHERE c.phone_number = r.phone_number
    AND EXISTS (
      SELECT 1 
      FROM broadcasts b 
      WHERE b.contact_id = c.id
    )
    ORDER BY c.created_at DESC
    LIMIT 1;

    -- If no contact has broadcasts, keep the most recent one
    IF keep_id IS NULL THEN
      SELECT id INTO keep_id
      FROM contacts
      WHERE phone_number = r.phone_number
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;

    -- Update broadcasts to point to the contact we're keeping
    UPDATE broadcasts
    SET contact_id = keep_id
    WHERE contact_id IN (
      SELECT id
      FROM contacts
      WHERE phone_number = r.phone_number
      AND id != keep_id
    );

    -- Now safe to delete duplicates
    DELETE FROM contacts
    WHERE phone_number = r.phone_number
    AND id != keep_id;
  END LOOP;
END $$;

-- Add unique constraint
ALTER TABLE contacts
ADD CONSTRAINT contacts_phone_number_unique UNIQUE (phone_number);

-- Create function to get duplicate contacts
CREATE OR REPLACE FUNCTION get_duplicate_contacts()
RETURNS TABLE (
  phone_number text,
  count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.phone_number,
    COUNT(*) as count
  FROM contacts c
  GROUP BY c.phone_number
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$;

-- Create function to remove duplicate contacts
CREATE OR REPLACE FUNCTION remove_duplicate_contacts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  keep_id uuid;
BEGIN
  FOR r IN (
    SELECT phone_number
    FROM contacts
    GROUP BY phone_number
    HAVING COUNT(*) > 1
  ) LOOP
    -- Find the contact with broadcasts first
    SELECT c.id INTO keep_id
    FROM contacts c
    LEFT JOIN broadcasts b ON b.contact_id = c.id
    WHERE c.phone_number = r.phone_number
    GROUP BY c.id, c.created_at
    ORDER BY COUNT(b.id) DESC, c.created_at DESC
    LIMIT 1;

    -- Update broadcasts to point to the contact we're keeping
    UPDATE broadcasts
    SET contact_id = keep_id
    WHERE contact_id IN (
      SELECT id
      FROM contacts
      WHERE phone_number = r.phone_number
      AND id != keep_id
    );

    -- Delete duplicates
    DELETE FROM contacts
    WHERE phone_number = r.phone_number
    AND id != keep_id;
  END LOOP;
END;
$$;