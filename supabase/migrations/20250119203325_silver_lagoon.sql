/*
  # Fix user signup and simplify schema
  
  1. Changes
    - Drop organization-related tables and triggers
    - Simplify RLS policies
    - Remove organization references
    
  2. Security
    - Enable RLS on all tables
    - Grant necessary permissions
*/

-- Drop organization-related objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Remove organization_id columns if they exist
ALTER TABLE contacts DROP COLUMN IF EXISTS organization_id;
ALTER TABLE messages DROP COLUMN IF EXISTS organization_id;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can access all contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can access all messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can access all broadcasts" ON broadcasts;

-- Create simplified policies
CREATE POLICY "Authenticated users can access all data"
    ON contacts
    FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can access all data"
    ON messages
    FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can access all data"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;