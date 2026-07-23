-- Migration 89: Create Order Corrections Table
-- Target Table: order_corrections

CREATE TABLE IF NOT EXISTS public.order_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.website_store_orders(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  items_snapshot JSONB NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  edited_by UUID REFERENCES public.website_store_admin(id) ON DELETE SET NULL,
  edit_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast foreign key lookups
CREATE INDEX IF NOT EXISTS idx_order_corrections_order_id ON public.order_corrections (order_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.order_corrections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid duplication
DROP POLICY IF EXISTS "Allow read-only public access to order_corrections" ON public.order_corrections;
DROP POLICY IF EXISTS "Block write access to order_corrections" ON public.order_corrections;

-- Allow SELECT for everyone (devotees need to see activeData / originalData if selected or mapped client-side, 
-- and RLS defaults allow SELECT when true)
CREATE POLICY "Allow read-only public access to order_corrections" 
ON public.order_corrections 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Block insert/update/delete for public/devotee roles (only admin token/service role key can modify)
CREATE POLICY "Block write access to order_corrections" 
ON public.order_corrections 
FOR ALL 
TO anon, authenticated 
USING (false) 
WITH CHECK (false);
