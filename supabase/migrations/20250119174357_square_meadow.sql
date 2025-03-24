/*
  # Fix Service Role Permissions for n8n Integration

  1. Changes
    - Drop and recreate service role policy with explicit permissions
    - Enable full access for service role to broadcast_contacts table
    - Ensure proper status updates from n8n

  2. Security
    - Maintains row-level security
    - Grants necessary permissions to service role
*/

-- Drop existing service role policy
DROP POLICY IF EXISTS "Service role can update broadcast_contacts" ON broadcast_contacts;

-- Create comprehensive service role policy
CREATE POLICY "Service role full access to broadcast_contacts"
    ON broadcast_contacts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant explicit permissions to service role
GRANT ALL ON broadcast_contacts TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;