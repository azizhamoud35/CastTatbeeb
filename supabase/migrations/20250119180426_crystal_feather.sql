/*
  # Add Auto-Finish Broadcast Status
  
  1. Add 'finished' status to broadcasts table check constraint
  2. Create function to check and update broadcast status
  3. Create trigger to automatically update broadcast status
*/

-- First, modify the broadcasts table to allow 'finished' status
DO $$ 
BEGIN
  ALTER TABLE broadcasts 
    DROP CONSTRAINT IF EXISTS broadcasts_status_check;
  
  ALTER TABLE broadcasts 
    ADD CONSTRAINT broadcasts_status_check 
    CHECK (status IN ('active', 'paused', 'finished'));
END $$;

-- Create function to check and update broadcast status
CREATE OR REPLACE FUNCTION check_broadcast_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If this was an update to broadcast_contacts status
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Check if there are any pending messages left for this broadcast
    IF NOT EXISTS (
      SELECT 1 
      FROM broadcast_contacts bc
      WHERE bc.broadcast_id = NEW.broadcast_id 
      AND bc.status = 'pending'
    ) THEN
      -- Update broadcast status to finished
      UPDATE broadcasts 
      SET status = 'finished'
      WHERE id = NEW.broadcast_id 
      AND status != 'finished';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on broadcast_contacts
DROP TRIGGER IF EXISTS update_broadcast_status ON broadcast_contacts;
CREATE TRIGGER update_broadcast_status
  AFTER UPDATE OF status
  ON broadcast_contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_broadcast_completion();