/*
  # Fix duplicate contacts functions

  1. Changes
    - Fixed ambiguous column references
    - Added explicit table aliases
    - Improved query performance with proper indexing
*/

-- Create index for phone_number to improve performance
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number 
ON contacts(phone_number);

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
    c.phone_number,
    COUNT(*) as count
  FROM contacts c
  GROUP BY c.phone_number
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
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
    SELECT c.phone_number
    FROM contacts c
    GROUP BY c.phone_number
    HAVING COUNT(*) > 1
  ) LOOP
    -- Delete all but the most recent contact for each phone number
    DELETE FROM contacts
    WHERE id IN (
      SELECT t.id
      FROM (
        SELECT c.id,
               ROW_NUMBER() OVER (
                 PARTITION BY c.phone_number
                 ORDER BY c.created_at DESC
               ) as rn
        FROM contacts c
        WHERE c.phone_number = r.phone_number
      ) t
      WHERE t.rn > 1
    );
  END LOOP;
END;
$$;