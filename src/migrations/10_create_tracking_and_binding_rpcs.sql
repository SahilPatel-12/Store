-- Migration: Create affiliate referral tracking and registration binding RPCs
-- Executed inside public schema

-- 1. Validate Affiliate Referral Code RPC
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code TEXT)
RETURNS TABLE (is_valid BOOLEAN, referrer_name TEXT) AS $$
#variable_conflict use_column
DECLARE
  v_name TEXT;
BEGIN
  SELECT u.full_name INTO v_name 
  FROM public.website_store_users u
  WHERE u.affiliate_code = p_code AND u.affiliate_status = 'active';

  IF v_name IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT true, v_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Log Referral Click RPC
CREATE OR REPLACE FUNCTION public.log_referral_click(
  p_referral_code TEXT,
  p_landing_page TEXT,
  p_device_id TEXT,
  p_ip TEXT,
  p_user_agent TEXT
)
RETURNS BOOLEAN AS $$
#variable_conflict use_column
DECLARE
  v_referrer_id UUID;
BEGIN
  SELECT u.id INTO v_referrer_id 
  FROM public.website_store_users u
  WHERE u.affiliate_code = p_referral_code AND u.affiliate_status = 'active';

  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.affiliate_clicks (referrer_id, referral_code, landing_page, device_id, ip_address, user_agent)
  VALUES (v_referrer_id, p_referral_code, p_landing_page, p_device_id, p_ip, p_user_agent);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind Referral on Devotee Signup RPC
CREATE OR REPLACE FUNCTION public.bind_referral_on_signup(
  p_referred_id UUID,
  p_referrer_code TEXT
)
RETURNS BOOLEAN AS $$
#variable_conflict use_column
DECLARE
  v_referrer_id UUID;
  v_already_referred UUID;
BEGIN
  -- 1. Check if user is already referred
  SELECT u.referred_by INTO v_already_referred
  FROM public.website_store_users u
  WHERE u.id = p_referred_id;

  IF v_already_referred IS NOT NULL THEN
    -- Devotee already has a referrer, do not overwrite (rebinding is disabled)
    RETURN false;
  END IF;

  -- 2. Resolve referrer by code
  SELECT u.id INTO v_referrer_id
  FROM public.website_store_users u
  WHERE u.affiliate_code = p_referrer_code AND u.affiliate_status = 'active';

  IF v_referrer_id IS NULL THEN
    -- Referrer not active or doesn't exist
    RETURN false;
  END IF;

  -- 3. Prevent self-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN false;
  END IF;

  -- 4. Set referrer on users table
  UPDATE public.website_store_users u
  SET referred_by = v_referrer_id
  WHERE u.id = p_referred_id;

  -- 5. Insert relationship record
  INSERT INTO public.affiliate_relationships (referrer_id, referred_id)
  VALUES (v_referrer_id, p_referred_id)
  ON CONFLICT (referred_id) DO NOTHING;

  -- 6. Log transaction
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    'REFERRAL_BOUND',
    'system',
    p_referred_id::TEXT,
    jsonb_build_object('referrer_id', v_referrer_id, 'code', p_referrer_code)
  );

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Prevent blocking registrations on tracking failures
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Referral Parent RPC
CREATE OR REPLACE FUNCTION public.get_referral_parent(p_user_id UUID)
RETURNS TABLE (parent_id UUID, full_name TEXT, affiliate_code TEXT) AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS parent_id,
    p.full_name,
    p.affiliate_code
  FROM public.website_store_users u
  JOIN public.website_store_users p ON p.id = u.referred_by
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get Referral Tree by Session (Recursive depth up to 5)
DROP FUNCTION IF EXISTS public.get_referral_tree_by_session(TEXT, INT);
CREATE OR REPLACE FUNCTION public.get_referral_tree_by_session(
  p_session_token TEXT,
  p_max_depth INT DEFAULT 5
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  referred_by UUID,
  level INT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
#variable_conflict use_column
DECLARE
  v_root_user_id UUID;
BEGIN
  v_root_user_id := public.fn_validate_user_session(p_session_token);
  IF v_root_user_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired session token.';
  END IF;

  RETURN QUERY
  WITH RECURSIVE referral_tree AS (
    -- Anchor member: immediate referrals (level 1)
    SELECT 
      u.id AS child_id,
      u.full_name AS child_name,
      u.referred_by AS child_referred_by,
      1 AS current_level,
      u.created_at AS child_joined
    FROM public.website_store_users u
    WHERE u.referred_by = v_root_user_id

    UNION ALL

    -- Recursive member: referrals of child referrals
    SELECT 
      u.id AS child_id,
      u.full_name AS child_name,
      u.referred_by AS child_referred_by,
      t.current_level + 1 AS current_level,
      u.created_at AS child_joined
    FROM public.website_store_users u
    JOIN referral_tree t ON u.referred_by = t.child_id
    WHERE t.current_level < p_max_depth
  )
  SELECT 
    t.child_id,
    t.child_name,
    t.child_referred_by,
    t.current_level,
    t.child_joined
  FROM referral_tree t
  ORDER BY t.current_level, t.child_joined DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
