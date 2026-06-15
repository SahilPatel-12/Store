-- Migration: Create withdrawal payout system and admin audit RPCs
-- Executed inside public schema

-- 1. ADD TXN_ID COLUMN TO AFFILIATE_WITHDRAWALS
ALTER TABLE public.affiliate_withdrawals 
  ADD COLUMN IF NOT EXISTS txn_id TEXT;

-- 2. RPC: CREATE WITHDRAWAL REQUEST (DEVOTEE-FACING)
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
BEGIN
  -- Validate session token
  v_user_id := public.fn_validate_user_session(p_session_token);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired session token.';
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

  -- Insert pending withdrawal request record
  INSERT INTO public.affiliate_withdrawals (
    user_id,
    amount,
    status,
    payment_method,
    payment_details
  ) VALUES (
    v_user_id,
    p_amount,
    'pending',
    p_method,
    p_details
  );

  -- Log action in audit log
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    'WITHDRAWAL_REQUESTED',
    v_user_id::TEXT,
    p_amount::TEXT,
    jsonb_build_object('method', p_method, 'details', p_details)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: ADMIN APPROVE WITHDRAWAL
DROP FUNCTION IF EXISTS public.admin_approve_withdrawal(TEXT, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(
  p_session_token TEXT,
  p_request_id UUID
)
RETURNS BOOLEAN AS $$
#variable_conflict use_column
DECLARE
  v_admin_id UUID;
  v_request RECORD;
BEGIN
  -- Validate admin session
  v_admin_id := public.fn_validate_admin_session(p_session_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired admin session token.';
  END IF;

  -- Retrieve request and ensure status is pending
  SELECT * INTO v_request 
  FROM public.affiliate_withdrawals 
  WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request Not Found: No withdrawal record matches the provided ID.';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Operation Blocked: Request is already in % status.', v_request.status;
  END IF;

  -- Update request to approved
  UPDATE public.affiliate_withdrawals
  SET status = 'approved',
      updated_at = now()
  WHERE id = p_request_id;

  -- Log audit
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    'WITHDRAWAL_APPROVED',
    v_admin_id::TEXT,
    p_request_id::TEXT,
    jsonb_build_object('amount', v_request.amount, 'user_id', v_request.user_id)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: ADMIN REJECT WITHDRAWAL (REFUNDS WALLET)
DROP FUNCTION IF EXISTS public.admin_reject_withdrawal(TEXT, UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(
  p_session_token TEXT,
  p_request_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
#variable_conflict use_column
DECLARE
  v_admin_id UUID;
  v_request RECORD;
BEGIN
  -- Validate admin session
  v_admin_id := public.fn_validate_admin_session(p_session_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired admin session token.';
  END IF;

  -- Retrieve request
  SELECT * INTO v_request 
  FROM public.affiliate_withdrawals 
  WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request Not Found: No withdrawal record matches the provided ID.';
  END IF;

  -- Rejection only valid for pending/approved states (paid cannot be rejected)
  IF v_request.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Operation Blocked: Paid or already resolved withdrawals cannot be rejected.';
  END IF;

  -- Restore funds in affiliate wallet (decrement withdrawn_amount)
  UPDATE public.affiliate_wallets
  SET withdrawn_amount = GREATEST(0.00, withdrawn_amount - v_request.amount),
      updated_at = now()
  WHERE user_id = v_request.user_id;

  -- Update request status
  UPDATE public.affiliate_withdrawals
  SET status = 'rejected',
      admin_notes = p_reason,
      updated_at = now()
  WHERE id = p_request_id;

  -- Log audit
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    'WITHDRAWAL_REJECTED',
    v_admin_id::TEXT,
    p_request_id::TEXT,
    jsonb_build_object('amount', v_request.amount, 'user_id', v_request.user_id, 'reason', p_reason)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: ADMIN MARK WITHDRAWAL AS PAID (FINALIZES TRANSACTION ID)
DROP FUNCTION IF EXISTS public.admin_mark_withdrawal_paid(TEXT, UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_mark_withdrawal_paid(
  p_session_token TEXT,
  p_request_id UUID,
  p_txn_id TEXT
)
RETURNS BOOLEAN AS $$
#variable_conflict use_column
DECLARE
  v_admin_id UUID;
  v_request RECORD;
BEGIN
  -- Validate admin session
  v_admin_id := public.fn_validate_admin_session(p_session_token);
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired admin session token.';
  END IF;

  -- Retrieve request
  SELECT * INTO v_request 
  FROM public.affiliate_withdrawals 
  WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request Not Found: No withdrawal record matches the provided ID.';
  END IF;

  -- Pay action is valid from approved or pending states
  IF v_request.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Operation Blocked: Request must be in pending or approved status to mark as paid.';
  END IF;

  -- Finalize payment status and append txn_id
  UPDATE public.affiliate_withdrawals
  SET status = 'paid',
      txn_id = p_txn_id,
      payment_details = payment_details || jsonb_build_object('txn_id', p_txn_id),
      updated_at = now()
  WHERE id = p_request_id;

  -- Log audit
  INSERT INTO public.affiliate_audit_logs (event_type, performed_by, target_id, payload)
  VALUES (
    'WITHDRAWAL_PAID',
    v_admin_id::TEXT,
    p_request_id::TEXT,
    jsonb_build_object('amount', v_request.amount, 'user_id', v_request.user_id, 'txn_id', p_txn_id)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. RPC: GET WITHDRAWAL HISTORY BY SESSION (DEVOTEE-FACING)
DROP FUNCTION IF EXISTS public.get_withdrawal_history_by_session(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_withdrawal_history_by_session(p_session_token TEXT)
RETURNS TABLE (
  id UUID,
  amount NUMERIC(12, 2),
  status TEXT,
  payment_method TEXT,
  payment_details JSONB,
  admin_notes TEXT,
  txn_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID;
BEGIN
  -- Validate session token
  v_user_id := public.fn_validate_user_session(p_session_token);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Invalid or expired session token.';
  END IF;

  RETURN QUERY
  SELECT 
    w.id,
    w.amount,
    w.status,
    w.payment_method,
    w.payment_details,
    w.admin_notes,
    w.txn_id,
    w.created_at
  FROM public.affiliate_withdrawals w
  WHERE w.user_id = v_user_id
  ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
