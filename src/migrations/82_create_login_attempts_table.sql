-- Migration 82: Create Admin Login Attempts Table for IP-based Rate Limiting & Lockout
-- Target Table: admin_login_attempts

CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  ip_address TEXT PRIMARY KEY,
  failed_count INTEGER DEFAULT 0 NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and block all direct access from anonymous/public roles
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block direct public access to admin_login_attempts" ON public.admin_login_attempts;
CREATE POLICY "Block direct public access to admin_login_attempts" 
ON public.admin_login_attempts 
FOR ALL 
TO anon, authenticated 
USING (false) 
WITH CHECK (false);
