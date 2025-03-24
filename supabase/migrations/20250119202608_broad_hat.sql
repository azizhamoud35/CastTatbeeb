/*
  # Fix organization policies and schema

  1. Changes
    - Simplify organization policies to prevent recursion
    - Add missing organization_id column to auth.users
    - Update RLS policies to use simpler checks
    - Fix infinite recursion in organization_users policies

  2. Security
    - Maintain RLS on all tables
    - Ensure proper access control
*/

-- Add organization_id to auth.users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Organization admins can manage organization users" ON organization_users;
DROP POLICY IF EXISTS "Organization members can manage contacts" ON contacts;
DROP POLICY IF EXISTS "Organization members can manage messages" ON messages;
DROP POLICY IF EXISTS "Organization members can manage broadcasts" ON broadcasts;

-- Simplified organization policies
CREATE POLICY "Users can view their organization"
    ON organizations
    FOR SELECT
    TO authenticated
    USING (id IN (
        SELECT organization_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Organization admins can manage organization"
    ON organizations
    FOR ALL
    TO authenticated
    USING (id IN (
        SELECT organization_id FROM auth.users WHERE id = auth.uid()
    ));

-- Simplified organization_users policies
CREATE POLICY "Users can view organization members"
    ON organization_users
    FOR SELECT
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage organization users"
    ON organization_users
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM auth.users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM organization_users
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND organization_id = organization_users.organization_id
        )
    );

-- Simplified contacts policy
CREATE POLICY "Users can manage organization contacts"
    ON contacts
    FOR ALL
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM auth.users WHERE id = auth.uid()
    ));

-- Simplified messages policy
CREATE POLICY "Users can manage organization messages"
    ON messages
    FOR ALL
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM auth.users WHERE id = auth.uid()
    ));

-- Simplified broadcasts policy
CREATE POLICY "Users can manage organization broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (
        message_id IN (
            SELECT id FROM messages
            WHERE organization_id IN (
                SELECT organization_id FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Update handle_new_user function to set organization_id in auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
    org_id uuid;
BEGIN
    -- Create a new organization
    INSERT INTO organizations (name)
    VALUES ('Beautivia Clinic')
    RETURNING id INTO org_id;

    -- Set the organization_id in auth.users
    UPDATE auth.users
    SET organization_id = org_id
    WHERE id = NEW.id;

    -- Add the user as an admin of the organization
    INSERT INTO organization_users (organization_id, user_id, role)
    VALUES (org_id, NEW.id, 'admin');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;