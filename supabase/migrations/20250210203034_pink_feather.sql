/*
  # Add unique constraint to contacts table

  1. Changes
    - Add unique constraint to phone_number column
    - Clean up any existing duplicates before adding constraint
    - Preserve broadcast history by updating references

  2. Data Preservation
    - Keeps the most recent contact for each duplicate phone number
    - Updates broadcast references to point to the kept contact
    - Ensures no data loss for broadcast history
*/

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

  -- Add unique constraint after cleaning up duplicates
  ALTER TABLE contacts
  ADD CONSTRAINT contacts_phone_number_unique UNIQUE (phone_number);
END $$;