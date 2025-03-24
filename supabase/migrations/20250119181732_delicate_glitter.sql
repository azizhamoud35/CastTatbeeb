/*
  # Add name column to messages table

  1. Changes
    - Add `name` column to `messages` table with NOT NULL constraint
    - Set default value to prevent issues with existing records
*/

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Untitled Broadcast';