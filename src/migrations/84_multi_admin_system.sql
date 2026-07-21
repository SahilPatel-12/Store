-- Migration 84: Multi-Admin System Foundation & Session Enhancements
-- Target Tables: website_store_admin, admin_sessions, admin_audit_logs

-- 1. Upgrade website_store_admin table for multi-admin support
ALTER TABLE public.website_store_admin 
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.website_store_admin(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add check constraint to enforce valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_admin_role'
  ) THEN
    ALTER TABLE public.website_store_admin
      ADD CONSTRAINT check_admin_role CHECK (role IN ('super_admin', 'admin', 'manager', 'editor'));
  END IF;
END $$;

-- Ensure root user 'admin' is preserved as Super Admin
UPDATE public.website_store_admin 
SET 
  role = 'super_admin',
  is_active = true,
  display_name = COALESCE(display_name, 'Root Super Admin')
WHERE username = 'admin';

-- 2. Upgrade admin_sessions table for multi-device labeling
ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS device_label TEXT;

-- 3. Add performance indexes for session and audit log lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
