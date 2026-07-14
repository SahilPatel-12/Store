-- Migration 83: Create Admin Audit Logs Table
-- Target Table: admin_audit_logs

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.website_store_admin(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and block all direct public access
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block direct public access to admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Block direct public access to admin_audit_logs" 
ON public.admin_audit_logs 
FOR ALL 
TO anon, authenticated 
USING (false) 
WITH CHECK (false);
