const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sql = `
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
  -- If status is 'Payment Pending', do not calculate commission yet
  IF NEW.status = 'Payment Pending' THEN
    RETURN NEW;
  END IF;

  -- Prevent duplicate commission calculations if trigger runs multiple times on status updates
  IF EXISTS (SELECT 1 FROM public.affiliate_commissions WHERE order_id = NEW.order_id) THEN
    RETURN NEW;
  END IF;

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

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_calculate_order_commissions ON public.website_store_orders;
CREATE TRIGGER trg_calculate_order_commissions
  AFTER INSERT OR UPDATE ON public.website_store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_calculate_order_commissions();
`;

async function run() {
  try {
    console.log('Recreating public.fn_calculate_order_commissions function and trg_calculate_order_commissions trigger...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });

    if (error) throw error;
    console.log('Commission trigger updated successfully! Output:', data);

  } catch (err) {
    console.error('Trigger update failed:', err);
  }
}

run();
