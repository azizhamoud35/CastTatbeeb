/*
  # Enhance broadcast_contacts table accessibility
  
  This migration ensures the broadcast_contacts table is fully accessible
  and adds additional logging capabilities
*/

-- Add trigger for logging status changes
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
    'broadcast_contacts',
    NEW.id,
    OLD.status,
    NEW.status,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_status text,
  new_status text,
  changed_at timestamptz DEFAULT now()
);

-- Create trigger
DROP TRIGGER IF EXISTS broadcast_contact_audit_trigger ON broadcast_contacts;
CREATE TRIGGER broadcast_contact_audit_trigger
  AFTER UPDATE OF status
  ON broadcast_contacts
  FOR EACH ROW
  EXECUTE FUNCTION log_broadcast_contact_changes();

-- Grant additional permissions
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON audit_logs TO service_role;

-- Ensure broadcast_contacts has proper permissions
ALTER TABLE broadcast_contacts ALTER COLUMN status DROP NOT NULL;
ALTER TABLE broadcast_contacts ALTER COLUMN status SET DEFAULT 'pending';

-- Add explicit grants for the sequence
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;