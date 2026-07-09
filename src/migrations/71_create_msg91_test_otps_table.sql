-- Migration: 71_create_msg91_test_otps_table.sql
DROP TABLE IF EXISTS public.website_store_msg91_test_otps CASCADE;

CREATE TABLE IF NOT EXISTS public.website_store_msg91_test_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  phone_number TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.website_store_msg91_test_otps ENABLE ROW LEVEL SECURITY;

-- Block all direct public access
DROP POLICY IF EXISTS "Block all public access" ON public.website_store_msg91_test_otps;
CREATE POLICY "Block all public access" 
  ON public.website_store_msg91_test_otps FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
