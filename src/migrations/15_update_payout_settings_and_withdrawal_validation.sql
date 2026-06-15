-- Migration: Update settings RPC for minimum withdrawal and add withdrawal validation for suspended accounts
-- Executed inside public schema

-- 1. DROP AND RECREATE admin_save_affiliate_settings WITH NEW SIGNATURE
DROP FUNCTION IF EXISTS public.admin_save_affiliate_settings(TEXT, INT, BOOLEAN, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_save_affiliate_settings(TEXT, INT, BOOLEAN, TEXT, NUMERIC) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_save_affiliate_settings(
  p_admin_token TEXT,
  p_max_depth INT,
  p_enabled BOOLEAN,
  p_commission_model TEXT,
  p_min_withdrawal NUMERIC
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
    ('affiliate_commission_model', to_jsonb(p_commission_model), now()),
    ('payout_rules', jsonb_build_object(
      'min_withdrawal_amount', p_min_withdrawal,
      'holding_period_days', COALESCE((SELECT (value->>'holding_period_days')::INT FROM public.affiliate_settings WHERE key = 'payout_rules'), 7)
    ), now())
  ON CONFLICT (key) DO UPDATE 
  SET value = EXCLUDED.value,
      updated_at = now();

  -- Log action
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, payload)
  VALUES (
    'SETTINGS_UPDATED',
    v_admin_username,
    jsonb_build_object(
      'max_depth', p_max_depth, 
      'enabled', p_enabled, 
      'commission_model', p_commission_model, 
      'min_withdrawal', p_min_withdrawal
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. DROP AND RECREATE create_withdrawal_request WITH STATUS VALIDATION
DROP FUNCTION IF EXISTS public.create_withdrawal_request(TEXT, NUMERIC, TEXT, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  p_session_token TEXT,
  p_amount NUMERIC,
  p_method TEXT,
  p_details JSONB
)
RETURNS BOOLEAN AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID;
  v_wallet RECORD;
  v_min_withdrawal NUMERIC;
  v_available NUMERIC;
  v_status TEXT;
BEGIN
  -- Validate session token
  v_user_id := public.fn_validate_user_session(p_session_token);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired session token.';
  END IF;

  -- Retrieve dynamic program settings and check user account status
  SELECT affiliate_status INTO v_status 
  FROM public.website_store_users 
  WHERE id = v_user_id;

  IF v_status = 'suspended' THEN
    RAISE EXCEPTION 'Validation Failed: Your affiliate account has been suspended. Payouts are blocked.';
  END IF;

  -- Lock wallet row to prevent concurrent balance race exploits
  SELECT * INTO v_wallet 
  FROM public.affiliate_wallets 
  WHERE user_id = v_user_id 
  FOR UPDATE;

  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet error: No affiliate wallet initialized for this devotee.';
  END IF;

  -- Get minimum withdrawal settings threshold
  SELECT COALESCE((value->>'min_withdrawal_amount')::NUMERIC, 1000.00) INTO v_min_withdrawal
  FROM public.affiliate_settings
  WHERE key = 'payout_rules';

  -- Check minimum amount
  IF p_amount < v_min_withdrawal THEN
    RAISE EXCEPTION 'Validation Failed: Withdrawal amount % is below the minimum allowed limit of %.', p_amount, v_min_withdrawal;
  END IF;

  -- Check available balance
  v_available := v_wallet.approved_earnings - v_wallet.withdrawn_amount;
  IF p_amount > v_available THEN
    RAISE EXCEPTION 'Validation Failed: Insufficient funds. Requested: %, Available: %.', p_amount, v_available;
  END IF;

  -- Deduct immediately by incrementing withdrawn_amount (decreases available_balance generated column)
  UPDATE public.affiliate_wallets
  SET withdrawn_amount = withdrawn_amount + p_amount,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Insert withdrawal log request
  INSERT INTO public.affiliate_withdrawals (
    user_id,
    amount,
    payment_method,
    payment_details,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_amount,
    p_method,
    p_details,
    'pending',
    now(),
    now()
  );

  -- Log action in audit table
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    'PAYOUT_REQUESTED',
    (SELECT full_name FROM public.website_store_users WHERE id = v_user_id),
    v_user_id::TEXT,
    jsonb_build_object('amount', p_amount, 'method', p_method)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
