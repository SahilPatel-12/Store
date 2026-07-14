-- Migration 81: Secure Admin Sessions Schema
-- Target Table: admin_sessions

-- 1. Rename column session_token to session_token_hash if not already done
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'admin_sessions' 
      AND column_name = 'session_token'
  ) THEN
    ALTER TABLE public.admin_sessions RENAME COLUMN session_token TO session_token_hash;
  END IF;
END $$;

-- 2. Re-create the fn_validate_admin_session helper function to perform secure SHA-256 hashing
CREATE OR REPLACE FUNCTION public.fn_validate_admin_session(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_session RECORD;
  v_hash TEXT;
BEGIN
  -- SHA-256 digest hashing using standard pgcrypto extension
  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT * INTO v_session 
  FROM public.admin_sessions 
  WHERE session_token_hash = v_hash AND expires_at > now();

  IF v_session IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.admin_sessions 
  SET last_activity = now() 
  WHERE id = v_session.id;

  RETURN v_session.admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
