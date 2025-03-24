/*
  # Rename broadcast tables for better clarity

  1. Changes
    - Rename 'broadcasts' table to 'messages'
    - Rename 'broadcast_contacts' table to 'broadcasts'
    - Update foreign key references
    - Update policies and triggers
    - Preserve all existing data
*/

-- Rename tables
ALTER TABLE IF EXISTS broadcasts 
  RENAME TO messages;

ALTER TABLE IF EXISTS broadcast_contacts 
  RENAME TO broadcasts;

-- Update foreign key reference
ALTER TABLE broadcasts 
  RENAME COLUMN broadcast_id TO message_id;

-- Update trigger function to use new table names
CREATE OR REPLACE FUNCTION check_broadcast_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM broadcasts b
      WHERE b.message_id = NEW.message_id 
      AND b.status = 'pending'
    ) THEN
      UPDATE messages 
      SET status = 'finished'
      WHERE id = NEW.message_id 
      AND status != 'finished';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update audit log function
CREATE OR REPLACE FUNCTION log_broadcast_contact_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    old_status,
    new_status,
    changed_at
  ) VALUES (
    'broadcasts',
    NEW.id,
    OLD.status,
    NEW.status,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger on renamed table
DROP TRIGGER IF EXISTS update_broadcast_status ON broadcasts;
CREATE TRIGGER update_broadcast_status
  AFTER UPDATE OF status
  ON broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION check_broadcast_completion();

DROP TRIGGER IF EXISTS broadcast_contact_audit_trigger ON broadcasts;
CREATE TRIGGER broadcast_contact_audit_trigger
  AFTER UPDATE OF status
  ON broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION log_broadcast_contact_changes();

-- Update policies for messages table
DROP POLICY IF EXISTS "Users can manage their own broadcasts" ON messages;
CREATE POLICY "Users can manage their own messages"
    ON messages
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Update policies for broadcasts table
DROP POLICY IF EXISTS "Users can manage their own broadcast contacts" ON broadcasts;
DROP POLICY IF EXISTS "Service role can manage broadcast_contacts" ON broadcasts;

CREATE POLICY "Users can manage their own broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage broadcasts"
    ON broadcasts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);