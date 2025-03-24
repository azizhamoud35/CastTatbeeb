/*
  # Create Beautivia Clinic Organization

  1. Changes
    - Create Beautivia Clinic organization
    - Update default organization name in handle_new_user function
*/

-- Update the default organization name in the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create a new organization
  INSERT INTO organizations (name)
  VALUES ('Beautivia Clinic')
  RETURNING id INTO NEW.organization_id;

  -- Add the user as an admin of the organization
  INSERT INTO organization_users (organization_id, user_id, role)
  VALUES (NEW.organization_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing organizations to Beautivia Clinic
UPDATE organizations
SET name = 'Beautivia Clinic'
WHERE name = 'My Organization';