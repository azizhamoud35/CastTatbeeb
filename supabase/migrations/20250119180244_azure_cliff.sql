/*
  # Restore Row Level Security with Safe Policy Creation
  
  1. Re-enable RLS on all tables
  2. Drop existing policies to avoid conflicts
  3. Create new policies with proper checks
  4. Set up service role access
  5. Maintain audit logging functionality
*/

-- Re-enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage their own broadcasts" ON broadcasts;
DROP POLICY IF EXISTS "Users can manage their own broadcast contacts" ON broadcast_contacts;
DROP POLICY IF EXISTS "Service role can manage broadcast_contacts" ON broadcast_contacts;

-- Recreate policies for contacts table
CREATE POLICY "Users can manage their own contacts"
    ON contacts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Recreate policies for broadcasts table
CREATE POLICY "Users can manage their own broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Recreate policies for broadcast_contacts table
CREATE POLICY "Users can manage their own broadcast contacts"
    ON broadcast_contacts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM broadcasts b
            WHERE b.id = broadcast_id
            AND b.user_id = auth.uid()
        )
    );

-- Create service role policy for broadcast_contacts
CREATE POLICY "Service role can manage broadcast_contacts"
    ON broadcast_contacts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Maintain necessary permissions for service role
GRANT ALL ON broadcast_contacts TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Ensure audit logging permissions are maintained
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON audit_logs TO service_role;

-- Maintain sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;