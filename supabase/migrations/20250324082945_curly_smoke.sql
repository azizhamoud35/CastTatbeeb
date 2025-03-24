/*
  # Add function to count contacts per tag

  1. Changes
    - Add function to count contacts per tag
    - Fix contact counting query
    - Add index for better performance

  2. Performance
    - Add index on contact_tags for faster counting
    - Optimize query with proper joins
*/

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON contact_tags(tag_id);

-- Create function to get tag counts
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
  SELECT 
    t.id,
    t.name,
    t.color,
    COUNT(DISTINCT ct.contact_id) as contact_count
  FROM tags t
  LEFT JOIN contact_tags ct ON ct.tag_id = t.id
  LEFT JOIN contacts c ON c.id = ct.contact_id AND c.is_active = true
  GROUP BY t.id, t.name, t.color
  ORDER BY t.name;
$$;