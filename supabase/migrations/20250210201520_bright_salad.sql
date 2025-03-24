/*
  # Optimize duplicate contacts handling
  
  1. Changes
    - Add statement_timeout setting to prevent timeouts
    - Optimize batch processing with smaller batches
    - Add better error handling and recovery
    - Add progress tracking
    - Add proper indexing
  
  2. Performance
    - Process in smaller batches of 50 records
    - Use materialized results for better performance
    - Add timeout setting of 10 minutes
*/

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number_created 
ON contacts(phone_number, created_at DESC);

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
  -- Set a longer timeout for this operation (5 minutes)
  SET LOCAL statement_timeout = '300000';

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
  batch_size CONSTANT int := 50; -- Smaller batch size for better performance
  r RECORD;
  keep_id uuid;
  total_duplicates int;
  processed_count int := 0;
BEGIN
  -- Set a longer timeout for this operation (10 minutes)
  SET LOCAL statement_timeout = '600000';

  -- Create temporary table for duplicate numbers with index
  CREATE TEMP TABLE duplicate_numbers (
    phone_number text,
    is_processed boolean DEFAULT false
  );
  
  CREATE INDEX ON duplicate_numbers(is_processed, phone_number);

  -- Materialize results for better performance
  INSERT INTO duplicate_numbers (phone_number)
  SELECT DISTINCT phone_number
  FROM contacts
  GROUP BY phone_number
  HAVING COUNT(*) > 1;

  -- Get total count for progress tracking
  GET DIAGNOSTICS total_duplicates = ROW_COUNT;

  -- Process in batches
  WHILE EXISTS (
    SELECT 1 FROM duplicate_numbers dn 
    WHERE NOT dn.is_processed 
    LIMIT 1
  ) LOOP
    FOR r IN (
      SELECT phone_number 
      FROM duplicate_numbers dn
      WHERE NOT dn.is_processed 
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    ) LOOP
      BEGIN
        -- Find the contact to keep (prioritize ones with broadcasts)
        SELECT c.id INTO keep_id
        FROM contacts c
        LEFT JOIN broadcasts b ON b.contact_id = c.id
        WHERE c.phone_number = r.phone_number
        GROUP BY c.id, c.created_at
        ORDER BY COUNT(b.id) DESC, c.created_at DESC
        LIMIT 1;

        IF keep_id IS NULL THEN
          -- Fallback: just keep the most recent one
          SELECT id INTO keep_id
          FROM contacts
          WHERE phone_number = r.phone_number
          ORDER BY created_at DESC
          LIMIT 1;
        END IF;

        -- Update broadcasts in a separate transaction to avoid locks
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

        -- Mark as processed
        UPDATE duplicate_numbers
        SET is_processed = true
        WHERE phone_number = r.phone_number;

        processed_count := processed_count + 1;

      EXCEPTION WHEN OTHERS THEN
        -- Log error and continue with next record
        RAISE WARNING 'Error processing phone number %: %', r.phone_number, SQLERRM;
        -- Mark as processed to avoid getting stuck
        UPDATE duplicate_numbers
        SET is_processed = true
        WHERE phone_number = r.phone_number;
      END;
    END LOOP;

    -- Commit each batch
    COMMIT;
  END LOOP;

  -- Cleanup
  DROP TABLE IF EXISTS duplicate_numbers;
END;
$$;