/*
  # Fix rooms table constraints and indexes

  1. Changes
    - Add unique constraint on room name
    - Add proper indexing for room queries
    - Enable RLS with appropriate policies
    
  2. Security
    - Enable RLS on rooms table
    - Add policy for authenticated users to read rooms data
*/

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users to read rooms
CREATE POLICY "Allow authenticated users to read rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (true);

-- Add unique constraint on room name if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rooms_name_key'
  ) THEN
    ALTER TABLE rooms ADD CONSTRAINT rooms_name_key UNIQUE (name);
  END IF;
END $$;