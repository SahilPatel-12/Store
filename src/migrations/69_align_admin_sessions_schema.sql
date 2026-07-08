-- Migration: Align admin_sessions columns and types
-- This ensures session_token is a TEXT column to support 64-character hex tokens and adds missing metadata columns.

-- 1. Alter column type to TEXT
ALTER TABLE public.admin_sessions ALTER COLUMN session_token TYPE TEXT;

-- 2. Add missing metadata columns if they do not exist
ALTER TABLE public.admin_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.admin_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.admin_sessions ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
