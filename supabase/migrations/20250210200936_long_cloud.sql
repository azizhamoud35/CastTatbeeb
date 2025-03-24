/*
  # Fix duplicate contacts removal query
  
  1. Changes
    - Fixed table references in subqueries
    - Improved query structure for better readability
    - Added explicit table aliases
*/

-- Function to get duplicate contacts with broadcast counts
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

-- Function to remove duplicate contacts while preserving broadcast history
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
    -- First, try to find a contact with broadcasts
    SELECT c.id INTO keep_id
    FROM contacts c
    WHERE c.phone_number = r.phone_number
    AND EXISTS (
      SELECT 1 
      FROM broadcasts b 
      WHERE b.contact_id = c.id
    )
    LIMIT 1;

    -- If no contact has broadcasts, keep the most recent one
    IF keep_id IS NULL THEN
      SELECT c.id INTO keep_id
      FROM contacts c
      WHERE c.phone_number = r.phone_number
      ORDER BY c.created_at DESC
      LIMIT 1;
    END IF;

    -- Delete all other duplicates
    DELETE FROM contacts
    WHERE phone_number = r.phone_number
    AND id != keep_id;
  END LOOP;
END;
$$;