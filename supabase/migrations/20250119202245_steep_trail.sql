-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Organization admins can manage users" ON organization_users;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_users;

-- Simplified organization_users policies
CREATE POLICY "Users can view their organization memberships"
    ON organization_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage organization users"
    ON organization_users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = organization_users.organization_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Update contacts policies to use organization_id from user's membership
DROP POLICY IF EXISTS "Organization members can view contacts" ON contacts;
DROP POLICY IF EXISTS "Organization members can manage contacts" ON contacts;
DROP POLICY IF EXISTS "Organization members can update contacts" ON contacts;
DROP POLICY IF EXISTS "Organization members can delete contacts" ON contacts;

CREATE POLICY "Organization members can manage contacts"
    ON contacts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = contacts.organization_id
            AND user_id = auth.uid()
        )
    );

-- Update messages policies
DROP POLICY IF EXISTS "Organization members can view messages" ON messages;
DROP POLICY IF EXISTS "Organization members can manage messages" ON messages;
DROP POLICY IF EXISTS "Organization members can update messages" ON messages;
DROP POLICY IF EXISTS "Organization members can delete messages" ON messages;

CREATE POLICY "Organization members can manage messages"
    ON messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = messages.organization_id
            AND user_id = auth.uid()
        )
    );

-- Update broadcasts policy
DROP POLICY IF EXISTS "Organization members can manage broadcasts" ON broadcasts;
CREATE POLICY "Organization members can manage broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = broadcasts.message_id
            AND EXISTS (
                SELECT 1 FROM organization_users ou
                WHERE ou.organization_id = m.organization_id
                AND ou.user_id = auth.uid()
            )
        )
    );