/*
  # Fix Status Update Policies

  1. Changes
    - Drop and recreate policies with simpler conditions
    - Enable proper status updates for both authenticated users and service role

  2. Security
    - Maintains row-level security
    - Allows proper status updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Service can update broadcast_contacts status" ON broadcast_contacts;
DROP POLICY IF EXISTS "Users can update their broadcast_contacts status" ON broadcast_contacts;
DROP POLICY IF EXISTS "Users can update their own broadcast status" ON broadcasts;
DROP POLICY IF EXISTS "Users can update their own contact status" ON contacts;

-- Recreate policies with simpler conditions
CREATE POLICY "Users can update their own broadcast status"
    ON broadcasts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact status"
    ON contacts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update broadcast_contacts status"
    ON broadcast_contacts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM broadcasts b
            WHERE b.id = broadcast_id
            AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can update broadcast_contacts"
    ON broadcast_contacts
    FOR ALL
    TO service_role
    USING (true);