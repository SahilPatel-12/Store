-- Migration 79: Filter out unpaid/pending commissions from Pundit/Affiliate Ledger until order payment is successful.
-- Executed inside public schema

CREATE OR REPLACE FUNCTION public.get_commissions_history_by_session(p_session_token TEXT)
RETURNS TABLE (
  id UUID,
  order_id TEXT,
  level INTEGER,
  order_total NUMERIC(12, 2),
  commission_percent NUMERIC(5, 2),
  commission_amount NUMERIC(12, 2),
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  buyer_name TEXT
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
    c.id,
    c.order_id,
    c.level,
    c.order_total,
    c.commission_percent,
    c.commission_amount,
    c.status,
    c.created_at,
    u.full_name AS buyer_name
  FROM public.affiliate_commissions c
  JOIN public.website_store_users u ON u.id = c.buyer_id
  JOIN public.website_store_orders o ON o.order_id = c.order_id
  WHERE c.referrer_id = v_user_id
    AND o.status <> 'Payment Pending'
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
