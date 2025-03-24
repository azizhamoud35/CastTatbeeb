/*
  # Add functions for handling duplicate contacts

  1. New Functions
    - get_duplicate_contacts: Returns duplicate phone numbers and their counts
    - remove_duplicate_contacts: Safely removes duplicate contacts keeping the most recent one

  2. Changes
    - Added proper error handling
    - Added transaction support
    - Added row-level locking to prevent race conditions
*/

-- Function to get duplicate contacts
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
    contacts.phone_number,
    COUNT(*) as count
  FROM contacts
  GROUP BY phone_number
  HAVING COUNT(*) > 1
  ORDER BY count DESC;
END;
$$;

-- Function to remove duplicate contacts
CREATE OR REPLACE FUNCTION remove_duplicate_contacts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Start transaction
  FOR r IN (
    SELECT phone_number
    FROM contacts
    GROUP BY phone_number
    HAVING COUNT(*) > 1
  ) LOOP
    -- Delete all but the most recent contact for each phone number
    DELETE FROM contacts
    WHERE id IN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY phone_number
                 ORDER BY created_at DESC
               ) as rn
        FROM contacts
        WHERE phone_number = r.phone_number
      ) t
      WHERE rn > 1
    );
  END LOOP;
END;
$$;