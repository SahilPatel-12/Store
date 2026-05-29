-- Migration: Create website_store_admin table and seed default administrative credentials

CREATE TABLE IF NOT EXISTS public.website_store_admin (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT website_store_admin_pkey PRIMARY KEY (id),
  CONSTRAINT website_store_admin_username_key UNIQUE (username)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_store_admin ENABLE ROW LEVEL SECURITY;

-- Drop policy if it already exists to avoid errors on multiple runs
DROP POLICY IF EXISTS "Allow public read access to website_store_admin" ON public.website_store_admin;

-- Create policy to allow client-side read access (SELECT) for credentials verification
CREATE POLICY "Allow public read access to website_store_admin"
ON public.website_store_admin
FOR SELECT
TO anon, authenticated
USING (true);

-- Seed default admin credentials (Username: admin, Password: admin123, SHA-256 hashed)
INSERT INTO public.website_store_admin (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (username) 
DO UPDATE SET password_hash = EXCLUDED.password_hash;
