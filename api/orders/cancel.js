import { supabaseAdmin } from '../_lib/supabase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { orderId, sessionToken } = req.body;

  if (!orderId || !sessionToken) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    // 1. Verify Devotee Session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      return res.status(401).json({ error: 'Unauthorized devotee session.' });
    }

    const userId = sessionData.user_id;

    // 2. Safely cancel the pending order in website_store_orders
    const { data: cancelledOrder, error: cancelError } = await supabaseAdmin
      .from('website_store_orders')
      .update({
        status: 'Cancelled',
        payment_status: 'Failed'
      })
      .or(`order_id.eq.${orderId},checkout_attempt_id.eq.${orderId}`)
      .eq('user_id', userId)
      .eq('status', 'Payment Pending')
      .select('*')
      .maybeSingle();

    if (cancelError) {
      console.error('[Cancel Order] Update Error:', cancelError);
      throw cancelError;
    }

    if (!cancelledOrder) {
      console.log(`[Cancel Order] No pending order found or already cancelled: ${orderId}`);
      return res.status(200).json({ success: true, message: 'No pending order found to cancel.' });
    }

    // 3. Resolve synced order in public.orders and update it to Cancelled
    try {
      let targetUserId = userId;
      if (cancelledOrder.phone_number) {
        let rawPhone = cancelledOrder.phone_number;
        let digits = String(rawPhone).replace(/[^0-9]/g, '');
        let customerPhone = digits;
        if (digits.length === 10) customerPhone = '+91' + digits;
        else if (digits.length > 10 && !rawPhone.startsWith('+')) customerPhone = '+' + digits;

        const { data: appUser } = await supabaseAdmin
          .from('app_users')
          .select('id')
          .or(`phone.eq.${customerPhone},phone.eq.${customerPhone.replace('+', '')}`)
          .maybeSingle();
        if (appUser) {
          targetUserId = appUser.id;
        }
      }

      const { data: syncedOrder } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('order_type', 'product')
        .eq('total_amount', Number(cancelledOrder.total))
        .eq('order_status', 'Draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (syncedOrder) {
        await supabaseAdmin
          .from('orders')
          .update({
            order_status: 'Cancelled',
            payment_status: 'failed'
          })
          .eq('id', syncedOrder.id);
        console.log(`[Cancel Order] Synced order cancelled in public.orders: ${syncedOrder.id}`);
      }
    } catch (syncErr) {
      console.warn('[Cancel Order] Synced order cancellation warning:', syncErr);
    }

    console.log(`[Cancel Order] Successfully cancelled pending checkout order: ${orderId}`);
    return res.status(200).json({ success: true, message: 'Pending order successfully cancelled.' });

  } catch (err) {
    console.error('[Cancel Order] Exception:', err);
    return res.status(500).json({ error: 'Order cancellation failed: ' + err.message });
  }
}
