-- Migration: Correct the foreign key constraint on public.admin_sessions
-- Drops the old constraint referencing table "admins" and establishes the correct constraint referencing "website_store_admin".

-- 1. Truncate old sessions to prevent constraint validation errors
TRUNCATE TABLE public.admin_sessions;

-- 2. Drop the incorrect constraint
ALTER TABLE public.admin_sessions DROP CONSTRAINT IF EXISTS admin_sessions_admin_id_fkey;

-- 3. Add the correct constraint referencing public.website_store_admin(id)
ALTER TABLE public.admin_sessions ADD CONSTRAINT admin_sessions_admin_id_fkey 
  FOREIGN KEY (admin_id) REFERENCES public.website_store_admin(id) ON DELETE CASCADE;
