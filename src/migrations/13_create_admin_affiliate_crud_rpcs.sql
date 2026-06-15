-- Migration: Admin Affiliate Configuration and Management CRUD RPCs
-- Executed inside public schema

-- 1. RPC: ADMIN GET ALL WITHDRAWAL REQUESTS
DROP FUNCTION IF EXISTS public.admin_get_all_withdrawals(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_get_all_withdrawals(p_admin_token TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  amount NUMERIC(12, 2),
  status TEXT,
  payment_method TEXT,
  payment_details JSONB,
  admin_notes TEXT,
  txn_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  devotee_name TEXT,
  devotee_email TEXT,
  devotee_phone TEXT
) AS $$
#variable_conflict use_column
DECLARE
  v_admin_id UUID;
BEGIN
  -- Verify administrator session
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid admin session.';
  END IF;

  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    w.amount,
    w.status,
    w.payment_method,
    w.payment_details,
    w.admin_notes,
    w.txn_id,
    w.created_at,
    u.full_name AS devotee_name,
    u.email AS devotee_email,
    u.phone_number AS devotee_phone
  FROM public.affiliate_withdrawals w
  JOIN public.website_store_users u ON u.id = w.user_id
  ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RPC: ADMIN GET ALL REFERRAL TIER LEVELS
DROP FUNCTION IF EXISTS public.admin_get_all_affiliate_levels(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_get_all_affiliate_levels(p_admin_token TEXT)
RETURNS TABLE (
  level_number INTEGER,
  commission_percentage NUMERIC(5, 2),
  enabled BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
#variable_conflict use_column
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid admin session.';
  END IF;

  RETURN QUERY
  SELECT 
    l.level_number,
    l.commission_percentage,
    l.enabled,
    l.created_at,
    l.updated_at
  FROM public.affiliate_levels l
  ORDER BY l.level_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: ADMIN GET ALL SYSTEM AFFILIATE SETTINGS
DROP FUNCTION IF EXISTS public.admin_get_all_affiliate_settings(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_get_all_affiliate_settings(p_admin_token TEXT)
RETURNS TABLE (
  key TEXT,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
#variable_conflict use_column
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid admin session.';
  END IF;

  RETURN QUERY
  SELECT 
    s.key,
    s.value,
    s.updated_at
  FROM public.affiliate_settings s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: ADMIN UPDATE GLOBAL SETTINGS
DROP FUNCTION IF EXISTS public.admin_save_affiliate_settings(TEXT, INT, BOOLEAN, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_save_affiliate_settings(
  p_admin_token TEXT,
  p_max_depth INT,
  p_enabled BOOLEAN,
  p_commission_model TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
  v_admin_username TEXT;
BEGIN
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid admin session.';
  END IF;

  SELECT username INTO v_admin_username FROM public.website_store_admin WHERE id = v_admin_id;

  -- Upsert system settings variables
  INSERT INTO public.affiliate_settings (key, value, updated_at)
  VALUES 
    ('affiliate_max_depth', to_jsonb(p_max_depth), now()),
    ('affiliate_enabled', to_jsonb(p_enabled), now()),
    ('affiliate_commission_model', to_jsonb(p_commission_model), now())
  ON CONFLICT (key) DO UPDATE 
  SET value = EXCLUDED.value,
      updated_at = now();

  -- Log action
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, payload)
  VALUES (
    'SETTINGS_UPDATED',
    v_admin_username,
    jsonb_build_object('max_depth', p_max_depth, 'enabled', p_enabled, 'commission_model', p_commission_model)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: ADMIN SAVE TIER LEVEL RATE (INSERT OR MODIFY)
DROP FUNCTION IF EXISTS public.admin_save_affiliate_level(TEXT, INT, NUMERIC, BOOLEAN) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_save_affiliate_level(
  p_admin_token TEXT,
  p_level_number INT,
  p_commission_percentage NUMERIC,
  p_enabled BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
  v_admin_username TEXT;
BEGIN
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid admin session.';
  END IF;

  SELECT username INTO v_admin_username FROM public.website_store_admin WHERE id = v_admin_id;

  IF p_level_number < 1 OR p_level_number > 20 THEN
    RAISE EXCEPTION 'Request Denied: Level number must be between 1 and 20.';
  END IF;

  IF p_commission_percentage < 0.00 OR p_commission_percentage > 100.00 THEN
    RAISE EXCEPTION 'Request Denied: Commission percentage must be between 0 and 100.';
  END IF;

  -- Upsert levels parameters
  INSERT INTO public.affiliate_levels (level_number, commission_percentage, enabled, updated_at)
  VALUES (p_level_number, p_commission_percentage, p_enabled, now())
  ON CONFLICT (level_number) DO UPDATE 
  SET commission_percentage = EXCLUDED.commission_percentage,
      enabled = EXCLUDED.enabled,
      updated_at = now();

  -- Log action
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    'LEVEL_SAVED',
    v_admin_username,
    p_level_number::TEXT,
    jsonb_build_object('percentage', p_commission_percentage, 'enabled', p_enabled)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. RPC: ADMIN REMOVE REFERRAL TIER LEVEL
DROP FUNCTION IF EXISTS public.admin_delete_affiliate_level(TEXT, INT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_affiliate_level(
  p_admin_token TEXT,
  p_level_number INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
  v_admin_username TEXT;
BEGIN
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid admin session.';
  END IF;

  SELECT username INTO v_admin_username FROM public.website_store_admin WHERE id = v_admin_id;

  -- Perform removal
  DELETE FROM public.affiliate_levels
  WHERE level_number = p_level_number;

  -- Log action
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id)
  VALUES (
    'LEVEL_DELETED',
    v_admin_username,
    p_level_number::TEXT
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
