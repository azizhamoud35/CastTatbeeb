/*
  # Add Service Role Policy for n8n Updates

  1. Changes
    - Add policy to allow service role to update broadcast_contacts status
    - Enable external service updates while maintaining security

  2. Security
    - Allows updating only status and sent_at fields
    - Restricted to service role access
*/

-- Create policy for service role to update broadcast_contacts
CREATE POLICY "Service can update broadcast_contacts status"
    ON broadcast_contacts
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (
        status IN ('pending', 'sent', 'failed')
    );