-- Migration: Fix admin withdrawal RPC signatures to use p_admin_token
-- Executed inside public schema

-- 1. RPC: ADMIN APPROVE WITHDRAWAL
DROP FUNCTION IF EXISTS public.admin_approve_withdrawal(TEXT, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(
  p_admin_token TEXT,
  p_request_id UUID
)
RETURNS BOOLEAN AS $$
#variable_conflict use_column
DECLARE
  v_admin_id UUID;
  v_request RECORD;
BEGIN
  -- Validate admin session using the passed p_admin_token
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
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


-- 2. RPC: ADMIN REJECT WITHDRAWAL (REFUNDS WALLET)
DROP FUNCTION IF EXISTS public.admin_reject_withdrawal(TEXT, UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(
  p_admin_token TEXT,
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
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
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


-- 3. RPC: ADMIN MARK WITHDRAWAL AS PAID (FINALIZES TRANSACTION ID)
DROP FUNCTION IF EXISTS public.admin_mark_withdrawal_paid(TEXT, UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_mark_withdrawal_paid(
  p_admin_token TEXT,
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
  v_admin_id := public.fn_validate_admin_session(p_admin_token);
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
