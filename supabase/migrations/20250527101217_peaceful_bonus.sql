/*
  # Initial Schema for Rental Management System

  1. New Tables
    - `rooms` - Stores room information
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `rent` (integer) - Monthly rent amount
      - `created_at` (timestamptz)
    
    - `tenants` - Stores tenant information
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text)
      - `room_id` (uuid, foreign key to rooms)
      - `join_date` (date)
      - `leave_date` (date, nullable)
      - `uses_mess` (boolean)
      - `deposit_amount` (integer)
      - `created_at` (timestamptz)
    
    - `rent_payments` - Tracks monthly rent payments
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `month` (date) - First day of the month being paid for
      - `amount_paid` (integer)
      - `payment_date` (date)
      - `created_at` (timestamptz)
    
    - `mess_payments` - Tracks monthly mess payments
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `month` (date) - First day of the month being paid for
      - `mess_charge` (integer)
      - `payment_date` (date)
      - `created_at` (timestamptz)
    
    - `deposit_transactions` - Tracks deposit-related transactions
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `date` (date)
      - `amount` (integer)
      - `type` (text) - Either 'deduction' or 'refund'
      - `reason` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  rent integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  room_id uuid REFERENCES rooms(id) NOT NULL,
  join_date date NOT NULL,
  leave_date date,
  uses_mess boolean DEFAULT false,
  deposit_amount integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create rent_payments table
CREATE TABLE IF NOT EXISTS rent_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  month date NOT NULL, -- First day of month
  amount_paid integer NOT NULL,
  payment_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create mess_payments table
CREATE TABLE IF NOT EXISTS mess_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  month date NOT NULL, -- First day of month
  mess_charge integer NOT NULL,
  payment_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create deposit_transactions table
CREATE TABLE IF NOT EXISTS deposit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  date date NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('deduction', 'refund')),
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users full access to rooms"
  ON rooms FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users full access to tenants"
  ON tenants FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users full access to rent_payments"
  ON rent_payments FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users full access to mess_payments"
  ON mess_payments FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users full access to deposit_transactions"
  ON deposit_transactions FOR ALL TO authenticated
  USING (true);