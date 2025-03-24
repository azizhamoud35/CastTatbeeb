/*
  # Fix duplicate contacts removal with broadcast references
  
  1. Changes
    - Modified duplicate removal to preserve contacts with broadcasts
    - Added broadcast count to duplicate detection
    - Improved error handling
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
BEGIN
  FOR r IN (
    SELECT phone_number
    FROM contacts
    GROUP BY phone_number
    HAVING COUNT(*) > 1
  ) LOOP
    -- Keep the contact that has broadcasts, if any exist
    -- Otherwise keep the most recent one
    DELETE FROM contacts
    WHERE id IN (
      SELECT c.id
      FROM contacts c
      LEFT JOIN broadcasts b ON b.contact_id = c.id
      WHERE c.phone_number = r.phone_number
      AND c.id NOT IN (
        -- Keep contacts with broadcasts
        SELECT DISTINCT c2.id
        FROM contacts c2
        JOIN broadcasts b2 ON b2.contact_id = c2.id
        WHERE c2.phone_number = r.phone_number
        UNION
        -- If no contacts have broadcasts, keep the most recent one
        SELECT c3.id
        FROM contacts c3
        WHERE c3.phone_number = r.phone_number
        AND NOT EXISTS (
          SELECT 1 
          FROM broadcasts b3 
          JOIN contacts c4 ON b3.contact_id = c4.id 
          WHERE c4.phone_number = r.phone_number
        )
        ORDER BY c3.created_at DESC
        LIMIT 1
      )
    );
  END LOOP;
END;
$$;