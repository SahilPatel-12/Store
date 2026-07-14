-- Migration 80: Secure Admin Table Access
-- Target Table: website_store_admin

-- 1. Enable Row Level Security (RLS) and drop public read policy
ALTER TABLE public.website_store_admin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to website_store_admin" ON public.website_store_admin;

-- 2. Drop the legacy authenticate_admin RPC function entirely
DROP FUNCTION IF EXISTS public.authenticate_admin(text, text, text, text);
