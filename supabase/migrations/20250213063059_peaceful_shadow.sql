/*
  # Add tags to contacts

  1. New Tables
    - `tags`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `color` (text)
      - `created_at` (timestamp)
    - `contact_tags`
      - `contact_id` (uuid, references contacts)
      - `tag_id` (uuid, references tags)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create tags table
CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    created_at timestamptz DEFAULT now()
);

-- Create contact_tags junction table
CREATE TABLE contact_tags (
    contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (contact_id, tag_id)
);

-- Create unique index on tag names
CREATE UNIQUE INDEX idx_tags_name ON tags(name);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage tags"
    ON tags
    FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage contact_tags"
    ON contact_tags
    FOR ALL
    TO authenticated
    USING (true);

-- Grant permissions
GRANT ALL ON tags TO authenticated;
GRANT ALL ON contact_tags TO authenticated;