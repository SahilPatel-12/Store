-- Migration: Create website_store_addresses table
CREATE TABLE IF NOT EXISTS public.website_store_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create public access policies matching the app's custom client-side auth
ALTER TABLE public.website_store_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON public.website_store_addresses;
DROP POLICY IF EXISTS "Allow public insert" ON public.website_store_addresses;
DROP POLICY IF EXISTS "Allow public update" ON public.website_store_addresses;
DROP POLICY IF EXISTS "Allow public delete" ON public.website_store_addresses;

CREATE POLICY "Allow public select" ON public.website_store_addresses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert" ON public.website_store_addresses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.website_store_addresses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.website_store_addresses FOR DELETE TO anon, authenticated USING (true);
