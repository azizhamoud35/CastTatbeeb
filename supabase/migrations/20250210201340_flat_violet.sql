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
  batch_size CONSTANT int := 100;
  r RECORD;
  keep_id uuid;
  total_duplicates int;
  processed_count int := 0;
BEGIN
  -- Create temporary table for duplicate phone numbers
  CREATE TEMP TABLE duplicate_numbers (
    phone_number text,
    is_processed boolean DEFAULT false
  );

  -- Populate temporary table
  INSERT INTO duplicate_numbers (phone_number)
  SELECT phone_number
  FROM contacts
  GROUP BY phone_number
  HAVING COUNT(*) > 1;

  -- Get total count for progress tracking
  SELECT COUNT(*) INTO total_duplicates FROM duplicate_numbers;

  -- Process in batches
  WHILE EXISTS (SELECT 1 FROM duplicate_numbers dn WHERE NOT dn.is_processed) LOOP
    FOR r IN (
      SELECT phone_number 
      FROM duplicate_numbers dn
      WHERE NOT dn.is_processed 
      LIMIT batch_size
    ) LOOP
      -- Start a subtransaction for each phone number
      BEGIN
        -- First, try to find a contact with broadcasts
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
          SELECT c.id INTO keep_id
          FROM contacts c
          WHERE c.phone_number = r.phone_number
          ORDER BY c.created_at DESC
          LIMIT 1;
        END IF;

        -- Update broadcasts to point to the contact we're keeping
        UPDATE broadcasts
        SET contact_id = keep_id
        WHERE contact_id IN (
          SELECT c.id
          FROM contacts c
          WHERE c.phone_number = r.phone_number
          AND c.id != keep_id
        );

        -- Delete other duplicates
        DELETE FROM contacts
        WHERE phone_number = r.phone_number
        AND id != keep_id;

        -- Mark as processed
        UPDATE duplicate_numbers dn
        SET is_processed = true 
        WHERE dn.phone_number = r.phone_number;

        processed_count := processed_count + 1;

        -- Commit the subtransaction
        RAISE NOTICE 'Progress: % of % phone numbers processed', processed_count, total_duplicates;
      EXCEPTION WHEN OTHERS THEN
        -- If there's an error, rollback this phone number but continue with others
        RAISE WARNING 'Error processing phone number %: %', r.phone_number, SQLERRM;
      END;
    END LOOP;
    
    -- Commit the batch
    COMMIT;
  END LOOP;

  -- Cleanup
  DROP TABLE duplicate_numbers;
END;
$$;