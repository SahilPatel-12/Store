-- Migration: Add join_affiliate_program_with_profile function to support promotional page applications
-- Executed inside public schema

CREATE OR REPLACE FUNCTION public.join_affiliate_program_with_profile(
  p_session_token TEXT,
  p_full_name TEXT,
  p_email TEXT
)
RETURNS TABLE (
  affiliate_code TEXT,
  affiliate_status TEXT,
  affiliate_joined_at TIMESTAMP WITH TIME ZONE
) AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID;
  v_status TEXT;
  v_code TEXT;
  v_joined TIMESTAMP WITH TIME ZONE;
  v_collision_count INTEGER := 0;
BEGIN
  -- Validate user session
  v_user_id := public.fn_validate_user_session(p_session_token);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired session token.';
  END IF;

  -- Validate inputs
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Request Denied: Full name is required.';
  END IF;
  
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Request Denied: Email is required.';
  END IF;

  -- Verify current state
  SELECT u.affiliate_status INTO v_status 
  FROM public.website_store_users u 
  WHERE u.id = v_user_id;

  IF v_status = 'active' THEN
    RAISE EXCEPTION 'Request Denied: Account is already registered as an active affiliate.';
  ELSIF v_status = 'pending' THEN
    RAISE EXCEPTION 'Request Denied: Account is already pending approval.';
  ELSIF v_status = 'suspended' THEN
    RAISE EXCEPTION 'Request Denied: Suspended devotee accounts cannot join the affiliate program.';
  END IF;

  -- Generate unique alphanumeric code if the user doesn't already have one
  SELECT u.affiliate_code, u.affiliate_joined_at INTO v_code, v_joined
  FROM public.website_store_users u
  WHERE u.id = v_user_id;

  IF v_code IS NULL OR v_code = '' THEN
    LOOP
      v_code := 'MP' || 
        (SELECT string_agg(substring('2346789ABCDEFGHJKMNPQRSTUVWXY' from (random() * 28 + 1)::integer for 1), '') 
         FROM generate_series(1, 6));
         
      -- Verify uniqueness
      IF NOT EXISTS(SELECT 1 FROM public.website_store_users u WHERE u.affiliate_code = v_code) THEN
        EXIT;
      END IF;
      
      v_collision_count := v_collision_count + 1;
      IF v_collision_count > 10 THEN
        RAISE EXCEPTION 'Operation Failed: Referral code generator encountered too many collisions.';
      END IF;
    END LOOP;
  END IF;

  IF v_joined IS NULL THEN
    v_joined := now();
  END IF;

  -- Write to users row (setting status to 'pending')
  UPDATE public.website_store_users u
  SET 
    full_name = p_full_name,
    email = p_email,
    affiliate_code = v_code,
    affiliate_status = 'pending',
    affiliate_joined_at = v_joined
  WHERE u.id = v_user_id;

  -- Initialize devotee wallet
  INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
  VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  -- Write transaction log
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES ('AFFILIATE_JOINED', 'devotee_session', v_user_id::TEXT, jsonb_build_object('code', v_code));

  RETURN QUERY SELECT v_code, 'pending'::TEXT, v_joined;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
