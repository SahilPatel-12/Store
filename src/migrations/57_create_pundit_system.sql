-- Migration: Add is_pundit to users, create admin_create_pundit and admin_update_pundit_password RPCs
-- Date: 2026-06-19

-- 1. Alter users table to add is_pundit column
ALTER TABLE public.website_store_users ADD COLUMN IF NOT EXISTS is_pundit BOOLEAN NOT NULL DEFAULT false;

-- 2. Create RPC for administrative pundit profile creation
CREATE OR REPLACE FUNCTION public.admin_create_pundit(
  p_admin_token TEXT,
  p_full_name TEXT,
  p_phone_number TEXT,
  p_password_hash TEXT
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  phone_number TEXT,
  affiliate_code TEXT
) AS $$
#variable_conflict use_column
DECLARE
  v_admin_id UUID;
  v_admin_username TEXT;
  v_user_id UUID;
  v_code TEXT;
  v_collision_count INTEGER := 0;
BEGIN
  -- Verify administrator session
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid administrator session.';
  END IF;

  SELECT username INTO v_admin_username FROM public.website_store_admin WHERE id = v_admin_id;

  -- Validate input and check if phone number exists
  IF EXISTS(SELECT 1 FROM public.website_store_users u WHERE u.phone_number = p_phone_number) THEN
    RAISE EXCEPTION 'Request Denied: A user with phone number % already exists.', p_phone_number;
  END IF;

  -- Generate unique affiliate code
  LOOP
    v_code := 'MP' || 
      (SELECT string_agg(substring('2346789ABCDEFGHJKMNPQRSTUVWXY' from (random() * 28 + 1)::integer for 1), '') 
       FROM generate_series(1, 6));
       
    IF NOT EXISTS(SELECT 1 FROM public.website_store_users u WHERE u.affiliate_code = v_code) THEN
      EXIT;
    END IF;
    
    v_collision_count := v_collision_count + 1;
    IF v_collision_count > 10 THEN
      RAISE EXCEPTION 'Operation Failed: Referral code generator encountered too many collisions.';
    END IF;
  END LOOP;

  -- Create user profile in website_store_users
  INSERT INTO public.website_store_users (
    full_name,
    phone_number,
    password_hash,
    is_pundit,
    affiliate_code,
    affiliate_status,
    affiliate_joined_at
  )
  VALUES (
    p_full_name,
    p_phone_number,
    p_password_hash,
    true,
    v_code,
    'active',
    now()
  )
  RETURNING id INTO v_user_id;

  -- Initialize devotee wallet
  INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
  VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  -- Write transaction log
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    'PUNDIT_CREATED',
    v_admin_username,
    v_user_id::TEXT,
    jsonb_build_object('name', p_full_name, 'phone', p_phone_number, 'code', v_code)
  );

  RETURN QUERY SELECT v_user_id, p_full_name, p_phone_number, v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create RPC for administrative pundit password updates
CREATE OR REPLACE FUNCTION public.admin_update_pundit_password(
  p_admin_token TEXT,
  p_target_user_id UUID,
  p_new_password_hash TEXT
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

  -- Update target profile's password hash
  UPDATE public.website_store_users
  SET password_hash = p_new_password_hash
  WHERE id = p_target_user_id AND is_pundit = true;

  -- Log action
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id)
  VALUES (
    'PUNDIT_PASSWORD_UPDATED',
    v_admin_username,
    p_target_user_id::TEXT
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
