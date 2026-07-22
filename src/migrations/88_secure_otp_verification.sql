-- 1. Create the OTP state tracking table
CREATE TABLE IF NOT EXISTS public.website_store_otps (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  attempts INT DEFAULT 0 NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_website_store_otps_lookup 
ON public.website_store_otps (phone_number, is_verified);

-- 2. Drop the old client-parameter-based RPC function signature
DROP FUNCTION IF EXISTS public.authenticate_user_otp(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 3. Create the refactored, secure RPC function signature
CREATE OR REPLACE FUNCTION public.authenticate_user_otp(
  p_phone TEXT,
  p_otp_entered TEXT,
  p_device_id TEXT,
  p_ip TEXT,
  p_user_agent TEXT
)
RETURNS TABLE (
  session_token TEXT,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone_number TEXT
) AS $$
#variable_conflict use_column
DECLARE
  v_user RECORD;
  v_session_token TEXT;
  v_expiry TIMESTAMP WITH TIME ZONE;
  v_stored_otp RECORD;
  v_ip TEXT;
  v_user_agent TEXT;
BEGIN
  -- Extract real client IP and User-Agent from Supabase request context headers if available
  v_ip := COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', p_ip, '127.0.0.1');
  IF position(',' in v_ip) > 0 THEN
    v_ip := split_part(v_ip, ',', 1);
  END IF;
  v_ip := trim(v_ip);

  v_user_agent := COALESCE(current_setting('request.headers', true)::json->>'user-agent', p_user_agent, 'unknown');

  -- Retrieve the latest unverified OTP generated within the last 5 minutes
  SELECT * INTO v_stored_otp 
  FROM public.website_store_otps o
  WHERE o.phone_number = p_phone 
    AND o.is_verified = false 
    AND o.created_at > now() - interval '5 minutes'
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF v_stored_otp IS NULL THEN
    RAISE EXCEPTION 'Access Denied: No active verification session found.';
  END IF;

  -- Block validation if brute force threshold is reached
  IF v_stored_otp.attempts >= 5 THEN
    RAISE EXCEPTION 'Access Denied: Too many failed verification attempts.';
  END IF;

  -- Record the verification attempt
  UPDATE public.website_store_otps 
  SET attempts = attempts + 1 
  WHERE id = v_stored_otp.id;

  -- Compare entered code (No backdoor bypass checks allowed)
  IF p_otp_entered != v_stored_otp.otp_code THEN
    RAISE EXCEPTION 'Access Denied: Invalid OTP verification code.';
  END IF;

  -- Mark the verification code as used
  UPDATE public.website_store_otps 
  SET is_verified = true 
  WHERE id = v_stored_otp.id;

  -- Fetch user profile
  SELECT * INTO v_user 
  FROM public.website_store_users u
  WHERE u.phone_number = p_phone;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Access Denied: No devotee account found with this phone number.';
  END IF;

  IF v_user.is_suspended THEN
    RAISE EXCEPTION 'Access Denied: Your account has been suspended.';
  END IF;

  -- Generate secure session
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expiry := now() + interval '30 days';

  -- Prune old sessions (keep latest 4)
  DELETE FROM public.user_sessions s
  WHERE s.user_id = v_user.id AND s.id NOT IN (
    SELECT s2.id FROM public.user_sessions s2
    WHERE s2.user_id = v_user.id 
    ORDER BY s2.last_activity DESC 
    LIMIT 4
  );

  -- Save session with IP and User-Agent binding details
  INSERT INTO public.user_sessions (user_id, session_token, device_id, ip_address, user_agent, expires_at)
  VALUES (v_user.id, v_session_token, p_device_id, v_ip, v_user_agent, v_expiry);

  UPDATE public.website_store_users u
  SET last_login_at = now() 
  WHERE u.id = v_user.id;

  RETURN QUERY SELECT 
    v_session_token, 
    v_user.id, 
    v_user.full_name, 
    v_user.email, 
    v_user.phone_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
