/*
  # Optimize tag filtering for large datasets
  
  1. Changes
    - Add function to efficiently get contacts by tags
    - Add materialized view for tag counts
    - Add indexes for better performance
    - Handle large datasets properly

  2. Performance
    - Use materialized view for tag counts
    - Use efficient joins and indexes
    - Avoid row limits
*/

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(is_active) WHERE is_active = true;

-- Create materialized view for tag counts
CREATE MATERIALIZED VIEW tag_counts AS
SELECT 
  t.id,
  t.name,
  t.color,
  COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true) as contact_count
FROM tags t
LEFT JOIN contact_tags ct ON ct.tag_id = t.id
LEFT JOIN contacts c ON c.id = ct.contact_id
GROUP BY t.id, t.name, t.color;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_tag_counts_id ON tag_counts(id);

-- Function to refresh tag counts
CREATE OR REPLACE FUNCTION refresh_tag_counts()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tag_counts;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh tag counts
CREATE TRIGGER refresh_tag_counts_contacts
AFTER INSERT OR UPDATE OR DELETE ON contacts
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_tag_counts();

CREATE TRIGGER refresh_tag_counts_contact_tags
AFTER INSERT OR UPDATE OR DELETE ON contact_tags
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_tag_counts();

-- Function to get tag counts
CREATE OR REPLACE FUNCTION get_tag_counts()
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  contact_count bigint
) 
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, color, contact_count
  FROM tag_counts
  ORDER BY name;
$$;

-- Function to get contacts by tags efficiently
CREATE OR REPLACE FUNCTION get_contacts_by_tags(tag_ids uuid[])
RETURNS TABLE (contact_id uuid) 
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT c.id
  FROM contacts c
  JOIN contact_tags ct ON ct.contact_id = c.id
  WHERE c.is_active = true
  AND ct.tag_id = ANY(tag_ids);
$$;