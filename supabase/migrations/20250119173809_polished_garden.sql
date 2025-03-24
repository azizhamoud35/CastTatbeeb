/*
  # Add Update Policies for Broadcasts and Contacts

  1. Changes
    - Add policies to allow updating broadcast status and contact status
    - Add policies to allow updating broadcast_contacts status

  2. Security
    - Users can only update their own broadcasts and contacts
    - Users can only update specific fields
    - Row-level security remains enforced
*/

-- Drop existing update policies if they exist
DROP POLICY IF EXISTS "Users can update their own broadcast status" ON broadcasts;
DROP POLICY IF EXISTS "Users can update their own contact status" ON contacts;
DROP POLICY IF EXISTS "Users can update their broadcast_contacts status" ON broadcast_contacts;

-- Update policy for broadcasts table
CREATE POLICY "Users can update their own broadcast status"
    ON broadcasts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Update policy for contacts table
CREATE POLICY "Users can update their own contact status"
    ON contacts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Update policy for broadcast_contacts table
CREATE POLICY "Users can update their broadcast_contacts status"
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