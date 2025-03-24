/*
  # Simplify database access
  
  1. Changes
    - Remove organization-based restrictions
    - Enable direct access for authenticated users
    - Simplify RLS policies
    
  2. Security
    - Maintain basic authentication checks
    - Allow authenticated users to access all data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage messages" ON messages;
DROP POLICY IF EXISTS "Users can manage broadcasts" ON broadcasts;

-- Create new simplified policies for contacts
DROP POLICY IF EXISTS "Authenticated users can access all contacts" ON contacts;
CREATE POLICY "Authenticated users can access all contacts"
    ON contacts
    FOR ALL
    TO authenticated
    USING (true);

-- Create new simplified policies for messages
DROP POLICY IF EXISTS "Authenticated users can access all messages" ON messages;
CREATE POLICY "Authenticated users can access all messages"
    ON messages
    FOR ALL
    TO authenticated
    USING (true);

-- Create new simplified policies for broadcasts
DROP POLICY IF EXISTS "Authenticated users can access all broadcasts" ON broadcasts;
CREATE POLICY "Authenticated users can access all broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;