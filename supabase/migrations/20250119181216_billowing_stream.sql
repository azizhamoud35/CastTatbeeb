/*
  # Remove audit logs functionality

  1. Changes
    - Drop audit_logs table
    - Remove audit logging trigger and function
    - Clean up related permissions
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS broadcast_contact_audit_trigger ON broadcasts;

-- Drop the function
DROP FUNCTION IF EXISTS log_broadcast_contact_changes();

-- Drop the audit_logs table
DROP TABLE IF EXISTS public.audit_logs;