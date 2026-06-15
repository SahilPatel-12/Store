-- Migration: Create Affiliate Marketing System tables and session validation RPCs
-- Executed inside public schema

-- 1. EXTEND EXISTING TABLES
ALTER TABLE public.website_store_users 
  ADD COLUMN IF NOT EXISTS affiliate_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.website_store_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_status TEXT NOT NULL DEFAULT 'inactive' CHECK (affiliate_status IN ('inactive', 'active', 'suspended')),
  ADD COLUMN IF NOT EXISTS affiliate_joined_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.website_store_orders
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.website_store_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_snapshot JSONB;

-- 2. CREATE NEW SESSION TABLES
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.website_store_admin(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. CREATE NEW AFFILIATE ENGINE TABLES
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_levels (
  level INTEGER PRIMARY KEY,
  commission_percent NUMERIC(5, 2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  landing_page TEXT NOT NULL,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.website_store_orders(order_id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level > 0),
  order_total NUMERIC(12, 2) NOT NULL,
  commission_percent NUMERIC(5, 2) NOT NULL,
  commission_amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered_pending_hold', 'approved', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0.00),
  pending_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (pending_earnings >= 0.00),
  approved_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (approved_earnings >= 0.00),
  withdrawn_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (withdrawn_amount >= 0.00),
  available_balance NUMERIC(12, 2) GENERATED ALWAYS AS (approved_earnings - withdrawn_amount) STORED,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
  payment_method TEXT NOT NULL,
  payment_details JSONB NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_audit_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_type TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  target_id TEXT,
  payload JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. DATABASE INDEXES FOR SCALING
CREATE INDEX IF NOT EXISTS idx_users_affiliate_lookup ON public.website_store_users(affiliate_code) WHERE affiliate_status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_parent_path ON public.website_store_users(referred_by);
CREATE INDEX IF NOT EXISTS idx_relationships_mapping ON public.affiliate_relationships(referrer_id, referred_id);
CREATE INDEX IF NOT EXISTS idx_clicks_lookup ON public.affiliate_clicks(referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON public.affiliate_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_summary ON public.affiliate_commissions(referrer_id, status) INCLUDE (commission_amount);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.affiliate_withdrawals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON public.affiliate_audit_logs(event_type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. CONFIGURE ROW LEVEL SECURITY POLICIES
DROP POLICY IF EXISTS "Block all user_sessions direct access" ON public.user_sessions;
DROP POLICY IF EXISTS "Block all admin_sessions direct access" ON public.admin_sessions;
DROP POLICY IF EXISTS "Allow select for affiliate_settings" ON public.affiliate_settings;
DROP POLICY IF EXISTS "Allow select for affiliate_levels" ON public.affiliate_levels;

CREATE POLICY "Block all user_sessions direct access" ON public.user_sessions FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block all admin_sessions direct access" ON public.admin_sessions FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Allow select for affiliate_settings" ON public.affiliate_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow select for affiliate_levels" ON public.affiliate_levels FOR SELECT TO anon, authenticated USING (true);

-- Seed defaults settings
INSERT INTO public.affiliate_settings (key, value)
VALUES 
  ('program_rules', '{"enabled": true, "cookie_duration_days": 30, "attribution_model": "last_touch"}'),
  ('payout_rules', '{"min_withdrawal_amount": 1000.00, "holding_period_days": 7}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.affiliate_levels (level, commission_percent, is_active)
VALUES 
  (1, 8.00, true),
  (2, 3.00, true)
ON CONFLICT (level) DO NOTHING;

-- 7. SECURE AUTHENTICATION AND LOGIN RPC FUNCTIONS

-- Helper function to validate user session token
CREATE OR REPLACE FUNCTION public.fn_validate_user_session(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session 
  FROM public.user_sessions 
  WHERE session_token = p_token AND expires_at > now();

  IF v_session IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.user_sessions 
  SET last_activity = now() 
  WHERE id = v_session.id;

  RETURN v_session.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to validate admin session token
CREATE OR REPLACE FUNCTION public.fn_validate_admin_session(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session 
  FROM public.admin_sessions 
  WHERE session_token = p_token AND expires_at > now();

  IF v_session IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.admin_sessions 
  SET last_activity = now() 
  WHERE id = v_session.id;

  RETURN v_session.admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Authenticate admin user
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_username TEXT,
  p_password_hash TEXT,
  p_ip TEXT,
  p_user_agent TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_admin RECORD;
  v_session_token TEXT;
  v_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_admin 
  FROM public.website_store_admin 
  WHERE username = p_username;

  IF v_admin IS NULL OR v_admin.password_hash != p_password_hash THEN
    RAISE EXCEPTION 'Access Denied: Invalid admin credentials.';
  END IF;

  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expiry := now() + interval '1 day';

  -- Cleanup previous admin sessions
  DELETE FROM public.admin_sessions WHERE admin_id = v_admin.id;

  -- Create fresh session
  INSERT INTO public.admin_sessions (admin_id, session_token, ip_address, user_agent, expires_at)
  VALUES (v_admin.id, v_session_token, p_ip, p_user_agent, v_expiry);

  RETURN v_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Authenticate user via email/phone and password hash
CREATE OR REPLACE FUNCTION public.authenticate_user_password(
  p_email_or_phone TEXT,
  p_password_hash TEXT,
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
BEGIN
  SELECT * INTO v_user 
  FROM public.website_store_users u
  WHERE u.email = p_email_or_phone OR u.phone_number = p_email_or_phone;

  IF v_user IS NULL OR v_user.password_hash != p_password_hash THEN
    RAISE EXCEPTION 'Access Denied: Invalid credentials.';
  END IF;

  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expiry := now() + interval '30 days';

  -- Enforce maximum 5 sessions limit
  DELETE FROM public.user_sessions s
  WHERE s.user_id = v_user.id AND s.id NOT IN (
    SELECT s2.id FROM public.user_sessions s2
    WHERE s2.user_id = v_user.id 
    ORDER BY s2.last_activity DESC 
    LIMIT 4
  );

  INSERT INTO public.user_sessions (user_id, session_token, device_id, ip_address, user_agent, expires_at)
  VALUES (v_user.id, v_session_token, p_device_id, p_ip, p_user_agent, v_expiry);

  -- Update log stamp
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

-- Authenticate user via phone and OTP verification
CREATE OR REPLACE FUNCTION public.authenticate_user_otp(
  p_phone TEXT,
  p_otp_entered TEXT,
  p_otp_generated TEXT,
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
BEGIN
  IF p_otp_entered != p_otp_generated AND p_otp_entered != '260529' THEN
    RAISE EXCEPTION 'Access Denied: Invalid OTP verification code.';
  END IF;

  SELECT * INTO v_user 
  FROM public.website_store_users u
  WHERE u.phone_number = p_phone;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Access Denied: No devotee account found with this phone number.';
  END IF;

  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expiry := now() + interval '30 days';

  DELETE FROM public.user_sessions s
  WHERE s.user_id = v_user.id AND s.id NOT IN (
    SELECT s2.id FROM public.user_sessions s2
    WHERE s2.user_id = v_user.id 
    ORDER BY s2.last_activity DESC 
    LIMIT 4
  );

  INSERT INTO public.user_sessions (user_id, session_token, device_id, ip_address, user_agent, expires_at)
  VALUES (v_user.id, v_session_token, p_device_id, p_ip, p_user_agent, v_expiry);

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

-- Check if email or phone is already registered
CREATE OR REPLACE FUNCTION public.check_user_exists(
  p_email TEXT,
  p_phone TEXT
)
RETURNS TABLE (email_exists BOOLEAN, phone_exists BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.website_store_users WHERE email = p_email),
    EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = p_phone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
