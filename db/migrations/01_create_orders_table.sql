-- Create table for storing website orders
CREATE TABLE IF NOT EXISTS website_store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES website_store_users(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  subtotal numeric(12, 2) NOT NULL,
  discount numeric(12, 2) NOT NULL,
  discount_percent integer NOT NULL,
  shipping numeric(12, 2) NOT NULL,
  tax numeric(12, 2) NOT NULL,
  total numeric(12, 2) NOT NULL,
  payment_method text NOT NULL,
  delivery_city text NOT NULL,
  delivery_state text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  pincode text NOT NULL,
  phone_number text NOT NULL,
  status text NOT NULL DEFAULT 'Being Packed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create public access policies matching the app's custom client-side auth
ALTER TABLE website_store_orders ENABLE ROW LEVEL SECURITY;

-- Check and drop existing policies if any (to avoid conflict)
DROP POLICY IF EXISTS "Allow public select" ON website_store_orders;
DROP POLICY IF EXISTS "Allow public insert" ON website_store_orders;
DROP POLICY IF EXISTS "Allow public update" ON website_store_orders;

CREATE POLICY "Allow public select" ON website_store_orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON website_store_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON website_store_orders FOR UPDATE USING (true);
