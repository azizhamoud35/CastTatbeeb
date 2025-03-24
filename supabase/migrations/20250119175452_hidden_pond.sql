/*
  # Disable Row Level Security

  This migration disables RLS on all tables. WARNING: This removes security controls!
*/

-- Disable RLS on all tables
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_contacts DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to authenticated users and service role
GRANT ALL ON contacts TO authenticated;
GRANT ALL ON broadcasts TO authenticated;
GRANT ALL ON broadcast_contacts TO authenticated;
GRANT ALL ON contacts TO service_role;
GRANT ALL ON broadcasts TO service_role;
GRANT ALL ON broadcast_contacts TO service_role;