/*
  # Add organization support

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `created_at` (timestamptz)
    
    - `organization_users`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `user_id` (uuid, references auth.users)
      - `role` (text, check: admin/member)
      - `created_at` (timestamptz)

  2. Changes
    - Add `organization_id` to contacts table
    - Add `organization_id` to messages table
    - Update RLS policies for organization-based access

  3. Security
    - Enable RLS on all new tables
    - Add policies for organization access
*/

-- Create organizations table
CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create organization_users table
CREATE TABLE organization_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'member')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing tables
ALTER TABLE contacts 
ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organizations"
    ON organizations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can update their organizations"
    ON organizations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Organization users policies
CREATE POLICY "Organization admins can manage users"
    ON organization_users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.organization_id = organization_users.organization_id
            AND ou.user_id = auth.uid()
            AND ou.role = 'admin'
        )
    );

CREATE POLICY "Users can view organization members"
    ON organization_users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.organization_id = organization_users.organization_id
            AND ou.user_id = auth.uid()
        )
    );

-- Update contacts policies
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;
CREATE POLICY "Organization members can view contacts"
    ON contacts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = contacts.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can manage contacts"
    ON contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = contacts.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can update contacts"
    ON contacts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = contacts.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can delete contacts"
    ON contacts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = contacts.organization_id
            AND user_id = auth.uid()
        )
    );

-- Update messages policies
DROP POLICY IF EXISTS "Users can manage their own messages" ON messages;
CREATE POLICY "Organization members can view messages"
    ON messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = messages.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can manage messages"
    ON messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = messages.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can update messages"
    ON messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = messages.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can delete messages"
    ON messages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE organization_id = messages.organization_id
            AND user_id = auth.uid()
        )
    );

-- Update broadcasts policies
DROP POLICY IF EXISTS "Users can manage their own broadcasts" ON broadcasts;
CREATE POLICY "Organization members can manage broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN organization_users ou ON ou.organization_id = m.organization_id
            WHERE m.id = broadcasts.message_id
            AND ou.user_id = auth.uid()
        )
    );

-- Create function to automatically create an organization and add user as admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create a new organization
  INSERT INTO organizations (name)
  VALUES ('My Organization')
  RETURNING id INTO NEW.organization_id;

  -- Add the user as an admin of the organization
  INSERT INTO organization_users (organization_id, user_id, role)
  VALUES (NEW.organization_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();