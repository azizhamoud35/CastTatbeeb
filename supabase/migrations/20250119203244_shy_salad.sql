/*
  # Simplify database schema and policies
  
  1. Changes
    - Drop all organization-related policies
    - Create simple policies for all authenticated users
    - Grant necessary permissions
    
  2. Security
    - Allow all authenticated users to access all data
    - Maintain basic RLS for unauthenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can access all contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can access all messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can access all broadcasts" ON broadcasts;

-- Create new simplified policies for contacts
CREATE POLICY "Authenticated users can access all contacts"
    ON contacts
    FOR ALL
    TO authenticated
    USING (true);

-- Create new simplified policies for messages
CREATE POLICY "Authenticated users can access all messages"
    ON messages
    FOR ALL
    TO authenticated
    USING (true);

-- Create new simplified policies for broadcasts
CREATE POLICY "Authenticated users can access all broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;