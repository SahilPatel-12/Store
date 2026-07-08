-- Migration: Rename column token to session_token in public.admin_sessions
-- This aligns the table columns with fn_validate_admin_session and the backend serverless API checks.

DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'admin_sessions' 
      AND column_name = 'token'
  ) THEN 
    ALTER TABLE public.admin_sessions RENAME COLUMN token TO session_token;
  END IF;
END $$;

-- Enforce UNIQUE constraint index on session_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
