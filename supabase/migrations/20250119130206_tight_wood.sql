/*
  # Initial Schema Setup for WhatsApp Broadcasting System

  1. New Tables
    - contacts
      - id (uuid, primary key)
      - phone_number (text)
      - is_active (boolean)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
    
    - broadcasts
      - id (uuid, primary key)
      - message (text)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
    
    - broadcast_contacts
      - id (uuid, primary key)
      - broadcast_id (uuid, foreign key)
      - contact_id (uuid, foreign key)
      - status (text) - pending/sent/failed
      - sent_at (timestamp)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create contacts table
CREATE TABLE contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number text NOT NULL,
    is_active boolean DEFAULT true,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create broadcasts table
CREATE TABLE broadcasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message text NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create broadcast_contacts table
CREATE TABLE broadcast_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id uuid REFERENCES broadcasts(id) NOT NULL,
    contact_id uuid REFERENCES contacts(id) NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_contacts ENABLE ROW LEVEL SECURITY;

-- Policies for contacts
CREATE POLICY "Users can manage their own contacts"
    ON contacts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for broadcasts
CREATE POLICY "Users can manage their own broadcasts"
    ON broadcasts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for broadcast_contacts
CREATE POLICY "Users can manage their own broadcast contacts"
    ON broadcast_contacts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM broadcasts b
            WHERE b.id = broadcast_id
            AND b.user_id = auth.uid()
        )
    );