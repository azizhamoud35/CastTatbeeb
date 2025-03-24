/*
  # Fix organization access and policies

  1. Changes
    - Simplify organization structure
    - Fix permission denied errors
    - Add proper organization-based access control
    - Remove recursive policies
    - Add missing organization_id handling

  2. Security
    - Maintain RLS on all tables
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Organization admins can manage organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_users;
DROP POLICY IF EXISTS "Admins can manage organization users" ON organization_users;
DROP POLICY IF EXISTS "Users can manage organization contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage organization messages" ON messages;
DROP POLICY IF EXISTS "Users can manage organization broadcasts" ON broadcasts;

-- Simplified organization access
CREATE POLICY "Users can access their organization"
    ON organizations
    FOR ALL
    TO authenticated
    USING (id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- Simplified organization users access
CREATE POLICY "Users can access organization members"
    ON organization_users
    FOR ALL
    TO authenticated
    USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- Simplified contacts access
CREATE POLICY "Users can manage contacts"
    ON contacts
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Simplified messages access
CREATE POLICY "Users can manage messages"
    ON messages
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Simplified broadcasts access
CREATE POLICY "Users can manage broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM messages
            WHERE id = message_id
            AND user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update existing data to ensure organization_id is set
DO $$ 
BEGIN
    -- Update contacts
    UPDATE contacts
    SET organization_id = (
        SELECT organization_id 
        FROM auth.users 
        WHERE users.id = contacts.user_id
    )
    WHERE organization_id IS NULL;

    -- Update messages
    UPDATE messages
    SET organization_id = (
        SELECT organization_id 
        FROM auth.users 
        WHERE users.id = messages.user_id
    )
    WHERE organization_id IS NULL;
END $$;