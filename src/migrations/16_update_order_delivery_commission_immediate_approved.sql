-- Migration: Update order status transition to immediately approve commissions upon delivery
-- Executed inside public schema

-- 1. RECREATE RESOLUTION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.fn_resolve_order_commissions()
RETURNS TRIGGER AS $$
DECLARE
  v_comm RECORD;
BEGIN
  -- Process only when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Status becomes Delivered -> Move pending to approved immediately
    IF NEW.status = 'Delivered' THEN
      FOR v_comm IN 
        SELECT id, referrer_id, commission_amount
        FROM public.affiliate_commissions
        WHERE order_id = NEW.order_id AND status = 'pending'
      LOOP
        -- Adjust wallet pools: shift pending to approved/total earned immediately
        UPDATE public.affiliate_wallets
        SET pending_earnings = GREATEST(0.00, pending_earnings - v_comm.commission_amount),
            approved_earnings = approved_earnings + v_comm.commission_amount,
            total_earned = total_earned + v_comm.commission_amount,
            updated_at = now()
        WHERE user_id = v_comm.referrer_id;

        -- Mark commission status as approved
        UPDATE public.affiliate_commissions
        SET status = 'approved',
            updated_at = now()
        WHERE id = v_comm.id;
      END LOOP;

    -- Status becomes Cancelled or Refunded -> Reverse commission ledger and wallet balances
    ELSIF NEW.status = 'Cancelled' OR NEW.status = 'Refunded' THEN
      FOR v_comm IN 
        SELECT id, referrer_id, commission_amount, status
        FROM public.affiliate_commissions
        WHERE order_id = NEW.order_id AND status IN ('pending', 'delivered_pending_hold', 'approved')
      LOOP
        -- Deduct from corresponding wallet balance pools
        IF v_comm.status = 'pending' OR v_comm.status = 'delivered_pending_hold' THEN
          UPDATE public.affiliate_wallets
          SET pending_earnings = GREATEST(0.00, pending_earnings - v_comm.commission_amount),
              updated_at = now()
          WHERE user_id = v_comm.referrer_id;
        ELSIF v_comm.status = 'approved' THEN
          UPDATE public.affiliate_wallets
          SET approved_earnings = GREATEST(0.00, approved_earnings - v_comm.commission_amount),
              total_earned = GREATEST(0.00, total_earned - v_comm.commission_amount),
              updated_at = now()
          WHERE user_id = v_comm.referrer_id;
        END IF;

        -- Cancel commission row
        UPDATE public.affiliate_commissions
        SET status = 'cancelled',
            updated_at = now()
        WHERE id = v_comm.id;
      END LOOP;
      
    END IF;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RUN ONE-TIME RECONCILIATION FOR PAST DELIVERED ORDERS
DO $$
DECLARE
  v_comm RECORD;
BEGIN
  FOR v_comm IN
    SELECT c.id, c.referrer_id, c.commission_amount, c.status
    FROM public.affiliate_commissions c
    JOIN public.website_store_orders o ON o.order_id = c.order_id
    WHERE o.status = 'Delivered' AND c.status IN ('pending', 'delivered_pending_hold')
  LOOP
    -- Shift pending to approved/total earned
    UPDATE public.affiliate_wallets
    SET pending_earnings = GREATEST(0.00, pending_earnings - v_comm.commission_amount),
        approved_earnings = approved_earnings + v_comm.commission_amount,
        total_earned = total_earned + v_comm.commission_amount,
        updated_at = now()
    WHERE user_id = v_comm.referrer_id;

    -- Mark commission status as approved
    UPDATE public.affiliate_commissions
    SET status = 'approved',
        updated_at = now()
    WHERE id = v_comm.id;
  END LOOP;
END;
$$;
