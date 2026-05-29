-- Migration: Create website_store_users table
CREATE TABLE IF NOT EXISTS public.website_store_users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  last_login_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT website_store_users_pkey PRIMARY KEY (id),
  CONSTRAINT website_store_users_email_key UNIQUE (email),
  CONSTRAINT website_store_users_phone_number_key UNIQUE (phone_number)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_store_users ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Allow public read access to website_store_users" ON public.website_store_users;
DROP POLICY IF EXISTS "Allow public insert access to website_store_users" ON public.website_store_users;
DROP POLICY IF EXISTS "Allow user update access to website_store_users" ON public.website_store_users;

-- Create policy to allow public select (required for checking if phone/email is registered)
CREATE POLICY "Allow public read access to website_store_users"
ON public.website_store_users
FOR SELECT
TO anon, authenticated
USING (true);

-- Create policy to allow public insert (required for registration)
CREATE POLICY "Allow public insert access to website_store_users"
ON public.website_store_users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create policy to allow public updates (required for updating last_login_at)
CREATE POLICY "Allow user update access to website_store_users"
ON public.website_store_users
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ==========================================
-- Migration: Create website_settings table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.website_settings (
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT website_settings_pkey PRIMARY KEY (key)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Allow public read access to website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Allow all access to website_settings" ON public.website_settings;

-- Create policy to allow public select
CREATE POLICY "Allow public read access to website_settings"
ON public.website_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Create policy to allow all write access (since admin panel performs writes directly)
CREATE POLICY "Allow all access to website_settings"
ON public.website_settings
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
