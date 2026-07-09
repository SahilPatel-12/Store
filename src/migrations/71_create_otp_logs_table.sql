-- Migration: Create website_store_otp_logs table for tracking OTP send rates and preventing spam abuse.
-- Date: 2026-07-09

CREATE TABLE IF NOT EXISTS public.website_store_otp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for high-performance rate checking and pruning queries
CREATE INDEX IF NOT EXISTS idx_otp_logs_phone_req ON public.website_store_otp_logs (phone_number, requested_at);
CREATE INDEX IF NOT EXISTS idx_otp_logs_ip_req ON public.website_store_otp_logs (ip_address, requested_at);
CREATE INDEX IF NOT EXISTS idx_otp_logs_requested_at ON public.website_store_otp_logs (requested_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_store_otp_logs ENABLE ROW LEVEL SECURITY;

-- Allow full access to Supabase service role / backend
DROP POLICY IF EXISTS "Allow service role all access" ON public.website_store_otp_logs;
CREATE POLICY "Allow service role all access" 
  ON public.website_store_otp_logs FOR ALL TO service_role USING (true);
