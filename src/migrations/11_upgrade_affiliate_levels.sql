-- Migration: Upgrade affiliate levels schema, default settings, and recursive commission triggers
-- Executed inside public schema

-- 1. RENAME COLUMNS IN AFFILIATE_LEVELS (SAFE/IDEMPOTENT RENAME)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='affiliate_levels' AND column_name='level') THEN
    ALTER TABLE public.affiliate_levels RENAME COLUMN level TO level_number;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='affiliate_levels' AND column_name='commission_percent') THEN
    ALTER TABLE public.affiliate_levels RENAME COLUMN commission_percent TO commission_percentage;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='affiliate_levels' AND column_name='is_active') THEN
    ALTER TABLE public.affiliate_levels RENAME COLUMN is_active TO enabled;
  END IF;
END $$;

-- 2. INJECT DEFAULT SYSTEM SETTINGS IN AFFILIATE_SETTINGS
INSERT INTO public.affiliate_settings (key, value)
VALUES 
  ('affiliate_max_depth', '5'::jsonb),
  ('affiliate_commission_model', '"last_touch"'::jsonb),
  ('affiliate_enabled', 'true'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. PRE-SEED LEVEL 1, 2, AND 3 COMMISSION RATES
INSERT INTO public.affiliate_levels (level_number, commission_percentage, enabled)
VALUES 
  (1, 8.00, true),
  (2, 2.00, true),
  (3, 1.00, true)
ON CONFLICT (level_number) DO UPDATE 
SET commission_percentage = EXCLUDED.commission_percentage, enabled = EXCLUDED.enabled;

-- 4. RECURSIVE COMMISSION TRIGGER FUNCTION ON ORDER PLACEMENT
DROP FUNCTION IF EXISTS public.fn_calculate_order_commissions() CASCADE;
CREATE OR REPLACE FUNCTION public.fn_calculate_order_commissions()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer_id UUID := NEW.user_id;
  v_current_referrer_id UUID;
  v_current_level INTEGER := 1;
  v_max_depth INTEGER;
  v_enabled BOOLEAN;
  v_commission_percentage NUMERIC;
  v_commission_amount NUMERIC;
  v_applied_commissions JSONB := '[]'::jsonb;
  v_snapshot_item JSONB;
  v_status TEXT := 'pending';
BEGIN
  -- If user_id is null (guest checkout), we cannot track referral chain
  IF v_buyer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Retrieve dynamic program settings
  SELECT COALESCE((value->>0)::boolean, true) INTO v_enabled FROM public.affiliate_settings WHERE key = 'affiliate_enabled';
  SELECT COALESCE((value->>0)::integer, 5) INTO v_max_depth FROM public.affiliate_settings WHERE key = 'affiliate_max_depth';

  -- If affiliate program is disabled, stop processing
  IF NOT v_enabled THEN
    RETURN NEW;
  END IF;

  -- Resolve Level 1 direct referrer
  SELECT referred_by INTO v_current_referrer_id
  FROM public.website_store_users
  WHERE id = v_buyer_id;

  -- If no direct referrer, stop processing
  IF v_current_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update referrer_id directly on the order record
  UPDATE public.website_store_orders
  SET referrer_id = v_current_referrer_id
  WHERE id = NEW.id;

  -- Traverse the parent referral chain recursively up to max depth
  WHILE v_current_referrer_id IS NOT NULL AND v_current_level <= v_max_depth LOOP
    -- Safety check: prevent cycles / self-referrals
    IF v_current_referrer_id = v_buyer_id THEN
      EXIT;
    END IF;

    -- Fetch commission rate for the current tier/level
    SELECT commission_percentage INTO v_commission_percentage
    FROM public.affiliate_levels
    WHERE level_number = v_current_level AND enabled = true;

    -- If rate is defined and active, calculate and record commission
    IF v_commission_percentage IS NOT NULL AND v_commission_percentage > 0 THEN
      v_commission_amount := ROUND((NEW.total * v_commission_percentage / 100.00), 2);

      -- Record the pending ledger transaction
      INSERT INTO public.affiliate_commissions (
        order_id,
        referrer_id,
        buyer_id,
        level,
        order_total,
        commission_percent,
        commission_amount,
        status
      ) VALUES (
        NEW.order_id,
        v_current_referrer_id,
        v_buyer_id,
        v_current_level,
        NEW.total,
        v_commission_percentage,
        v_commission_amount,
        v_status
      );

      -- Update the referrer's wallet pending balance
      INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
      VALUES (v_current_referrer_id, 0.00, v_commission_amount, 0.00, 0.00)
      ON CONFLICT (user_id) DO UPDATE 
      SET pending_earnings = public.affiliate_wallets.pending_earnings + EXCLUDED.pending_earnings,
          updated_at = now();

      -- Append metadata detail to snap array
      v_snapshot_item := jsonb_build_object(
        'level', v_current_level,
        'affiliate_id', v_current_referrer_id,
        'percentage', v_commission_percentage,
        'amount', v_commission_amount
      );
      v_applied_commissions := v_applied_commissions || jsonb_build_array(v_snapshot_item);
    END IF;

    -- Move up to parent node
    v_current_level := v_current_level + 1;
    
    SELECT referred_by INTO v_current_referrer_id
    FROM public.website_store_users
    WHERE id = v_current_referrer_id;
  END LOOP;

  -- Save freeze snapshot to order
  UPDATE public.website_store_orders
  SET affiliate_snapshot = jsonb_build_object(
    'buyer_id', v_buyer_id,
    'order_total', NEW.total,
    'max_depth_limit', v_max_depth,
    'applied_commissions', v_applied_commissions
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind AFTER INSERT trigger to website_store_orders
DROP TRIGGER IF EXISTS trg_calculate_order_commissions ON public.website_store_orders;
CREATE TRIGGER trg_calculate_order_commissions
  AFTER INSERT ON public.website_store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_calculate_order_commissions();


-- 5. ORDER LIFECYCLE RESOLUTION TRIGGER FUNCTION
DROP FUNCTION IF EXISTS public.fn_resolve_order_commissions() CASCADE;
CREATE OR REPLACE FUNCTION public.fn_resolve_order_commissions()
RETURNS TRIGGER AS $$
DECLARE
  v_comm RECORD;
BEGIN
  -- Process only when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Status becomes Delivered -> Move pending to delivered_pending_hold
    IF NEW.status = 'Delivered' THEN
      UPDATE public.affiliate_commissions
      SET status = 'delivered_pending_hold',
          updated_at = now()
      WHERE order_id = NEW.order_id AND status = 'pending';

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

-- Bind AFTER UPDATE OF status trigger to website_store_orders
DROP TRIGGER IF EXISTS trg_resolve_order_commissions ON public.website_store_orders;
CREATE TRIGGER trg_resolve_order_commissions
  AFTER UPDATE OF status ON public.website_store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_resolve_order_commissions();


-- 6. RPC: MATURE & APPROVE COMMISSIONS AFTER HOLD WINDOW
DROP FUNCTION IF EXISTS public.approve_matured_commissions() CASCADE;
CREATE OR REPLACE FUNCTION public.approve_matured_commissions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_comm RECORD;
  v_holding_days INTEGER;
BEGIN
  -- Retrieve holding period setting from payout rules, default to 7 days
  SELECT COALESCE((value->>'holding_period_days')::INTEGER, 7) INTO v_holding_days
  FROM public.affiliate_settings
  WHERE key = 'payout_rules';

  -- Loop through holding commissions that have matured
  FOR v_comm IN
    SELECT id, referrer_id, commission_amount
    FROM public.affiliate_commissions
    WHERE status = 'delivered_pending_hold'
      AND updated_at + (v_holding_days * INTERVAL '1 day') <= now()
  LOOP
    -- Mark commission status as approved
    UPDATE public.affiliate_commissions
    SET status = 'approved',
        updated_at = now()
    WHERE id = v_comm.id;

    -- Adjust wallet pools: shift pending to approved/total earned
    UPDATE public.affiliate_wallets
    SET pending_earnings = GREATEST(0.00, pending_earnings - v_comm.commission_amount),
        approved_earnings = approved_earnings + v_comm.commission_amount,
        total_earned = total_earned + v_comm.commission_amount,
        updated_at = now()
    WHERE user_id = v_comm.referrer_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. RPC: RECALCULATE ON PARTIAL REFUND
DROP FUNCTION IF EXISTS public.recalculate_order_commissions(TEXT, NUMERIC) CASCADE;
CREATE OR REPLACE FUNCTION public.recalculate_order_commissions(
  p_order_id TEXT,
  p_new_total NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
  v_comm RECORD;
  v_new_amount NUMERIC;
  v_difference NUMERIC;
BEGIN
  -- Verify order exists in e-commerce ledger
  IF NOT EXISTS (SELECT 1 FROM public.website_store_orders WHERE order_id = p_order_id) THEN
    RETURN false;
  END IF;

  -- Ensure order table total matches new total
  UPDATE public.website_store_orders
  SET total = p_new_total
  WHERE order_id = p_order_id;

  -- Loop through active commissions for the order
  FOR v_comm IN
    SELECT id, referrer_id, commission_percent, commission_amount, status
    FROM public.affiliate_commissions
    WHERE order_id = p_order_id AND status IN ('pending', 'delivered_pending_hold', 'approved')
  LOOP
    v_new_amount := ROUND((p_new_total * v_comm.commission_percent / 100.00), 2);
    v_difference := v_comm.commission_amount - v_new_amount;

    IF v_difference != 0 THEN
      -- Rebalance wallets pools
      IF v_comm.status = 'pending' OR v_comm.status = 'delivered_pending_hold' THEN
        UPDATE public.affiliate_wallets
        SET pending_earnings = GREATEST(0.00, pending_earnings - v_difference),
            updated_at = now()
        WHERE user_id = v_comm.referrer_id;
      ELSIF v_comm.status = 'approved' THEN
        UPDATE public.affiliate_wallets
        SET approved_earnings = GREATEST(0.00, approved_earnings - v_difference),
            total_earned = GREATEST(0.00, total_earned - v_difference),
            updated_at = now()
        WHERE user_id = v_comm.referrer_id;
      END IF;

      -- Update the commission row
      UPDATE public.affiliate_commissions
      SET order_total = p_new_total,
          commission_amount = v_new_amount,
          updated_at = now()
      WHERE id = v_comm.id;
    END IF;
  END LOOP;

  -- Refresh frozen snapshot
  UPDATE public.website_store_orders o
  SET affiliate_snapshot = jsonb_build_object(
    'buyer_id', o.user_id,
    'order_total', p_new_total,
    'max_depth_limit', COALESCE((SELECT (value->>0)::integer FROM public.affiliate_settings WHERE key = 'affiliate_max_depth'), 5),
    'applied_commissions', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'level', c.level,
            'affiliate_id', c.referrer_id,
            'percentage', c.commission_percent,
            'amount', c.commission_amount
          )
        )
        FROM public.affiliate_commissions c
        WHERE c.order_id = p_order_id
      ),
      '[]'::jsonb
    )
  )
  WHERE o.order_id = p_order_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
