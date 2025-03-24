-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON contact_tags(tag_id);

-- Create function to get tag counts with proper active contact filtering
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
  WITH active_contacts AS (
    SELECT id FROM contacts WHERE is_active = true
  )
  SELECT 
    t.id,
    t.name,
    t.color,
    COUNT(DISTINCT ct.contact_id) FILTER (WHERE ct.contact_id IN (SELECT id FROM active_contacts)) as contact_count
  FROM tags t
  LEFT JOIN contact_tags ct ON ct.tag_id = t.id
  GROUP BY t.id, t.name, t.color
  ORDER BY t.name;
$$;