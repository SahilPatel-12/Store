-- Migration: Create affiliate enrollment and administration RPCs
-- Executed inside public schema

-- 1. Devotee Affiliate Enrollment RPC
CREATE OR REPLACE FUNCTION public.join_affiliate_program(
  p_session_token TEXT
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

  -- Verify devotee state
  SELECT u.affiliate_status INTO v_status 
  FROM public.website_store_users u 
  WHERE u.id = v_user_id;

  IF v_status = 'active' THEN
    RAISE EXCEPTION 'Request Denied: Account is already registered as an active affiliate.';
  ELSIF v_status = 'suspended' THEN
    RAISE EXCEPTION 'Request Denied: Suspended devotee accounts cannot join the affiliate program.';
  END IF;

  -- Generate unique alphanumeric code (Prefix MP + 6 digits, avoiding O,0,1,I,L,S,5)
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

  v_joined := now();

  -- Write to users row
  UPDATE public.website_store_users u
  SET 
    affiliate_code = v_code,
    affiliate_status = 'active',
    affiliate_joined_at = v_joined
  WHERE u.id = v_user_id;

  -- Initialize devotee wallet
  INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
  VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  -- Write transaction log
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES ('AFFILIATE_JOINED', 'devotee_session', v_user_id::TEXT, jsonb_build_object('code', v_code));

  RETURN QUERY SELECT v_code, 'active'::TEXT, v_joined;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Devotee Affiliate Profile Lookup RPC
CREATE OR REPLACE FUNCTION public.get_affiliate_profile(
  p_session_token TEXT
)
RETURNS TABLE (
  affiliate_code TEXT,
  affiliate_status TEXT,
  joined_at TIMESTAMP WITH TIME ZONE,
  total_earned NUMERIC(12,2),
  pending_earnings NUMERIC(12,2),
  approved_earnings NUMERIC(12,2),
  available_balance NUMERIC(12,2)
) AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := public.fn_validate_user_session(p_session_token);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired session token.';
  END IF;

  RETURN QUERY
  SELECT 
    u.affiliate_code,
    u.affiliate_status,
    u.affiliate_joined_at,
    COALESCE(w.total_earned, 0.00),
    COALESCE(w.pending_earnings, 0.00),
    COALESCE(w.approved_earnings, 0.00),
    COALESCE(w.available_balance, 0.00)
  FROM public.website_store_users u
  LEFT JOIN public.affiliate_wallets w ON w.user_id = u.id
  WHERE u.id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Administrative Payout/Affiliate Status Setter RPC
CREATE OR REPLACE FUNCTION public.admin_set_affiliate_status(
  p_admin_token TEXT,
  p_target_user_id UUID,
  p_new_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
  v_admin_username TEXT;
BEGIN
  -- Verify admin session
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid administrator session.';
  END IF;

  SELECT username INTO v_admin_username FROM public.website_store_admin WHERE id = v_admin_id;

  IF p_new_status NOT IN ('active', 'suspended', 'inactive') THEN
    RAISE EXCEPTION 'Request Denied: Invalid target status.';
  END IF;

  -- Update target profile
  UPDATE public.website_store_users
  SET affiliate_status = p_new_status
  WHERE id = p_target_user_id;

  -- Log action
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    CASE 
      WHEN p_new_status = 'suspended' THEN 'AFFILIATE_SUSPENDED'
      ELSE 'AFFILIATE_REACTIVATED'
    END,
    v_admin_username,
    p_target_user_id::TEXT,
    jsonb_build_object('status', p_new_status)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
