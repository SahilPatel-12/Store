-- Migration: Add verification docs, registration status and RLS policies to website_store_pundits
-- Date: 2026-06-23

BEGIN;

-- 1. Alter public.website_store_pundits table to add new onboarding and registration fields
ALTER TABLE public.website_store_pundits 
  ADD COLUMN IF NOT EXISTS aadhaar_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS temple_auth_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- 2. Drop existing insert/update policies if they exist to avoid duplicate errors
DROP POLICY IF EXISTS "Allow public insert access to website_store_pundits" ON public.website_store_pundits;
DROP POLICY IF EXISTS "Allow public update access to website_store_pundits" ON public.website_store_pundits;

-- 3. Create RLS policies to allow insert and update from client-side onboarding
CREATE POLICY "Allow public insert access to website_store_pundits"
ON public.website_store_pundits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to website_store_pundits"
ON public.website_store_pundits
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

COMMIT;
