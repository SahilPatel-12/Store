import { supabaseAdmin } from '../../_lib/supabase-admin.js';
import { getRazorpayClient } from '../../_lib/razorpay-client.js';

// Verify the devotee session and return customer ID
async function verifySession(token) {
  if (!token) return null;
  const { data, error } = await supabaseAdmin
    .from('user_sessions')
    .select('user_id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) return null;
  return data.user_id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { orderId, sessionToken } = req.body || {};

  if (!orderId || !sessionToken) {
    return res.status(400).json({ error: 'Missing required parameters orderId or sessionToken.' });
  }

  try {
    // 1. Verify devotee session
    const devoteeId = await verifySession(sessionToken);
    if (!devoteeId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired customer session.' });
    }

    // 2. Fetch the internal order from the database
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('website_store_orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // 3. Verify order ownership
    if (order.user_id !== devoteeId) {
      return res.status(403).json({ error: 'Forbidden: Order ownership verification failed.' });
    }

    // 4. Verify order payment status
    if (order.payment_status !== 'Pending') {
      return res.status(400).json({ error: `Order is already in ${order.payment_status} state.` });
    }

    // 5. Load active payment gateway activation settings
    const { data: activation } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'payment_activation_settings')
      .maybeSingle();

    const activeProvider = activation?.value?.activePaymentProvider || 'manual_upi';
    const activeMode = activation?.value?.razorpayMode || 'test';

    // Verify if Razorpay configuration exists in database
    const { data: rzpConfig, error: rzpConfigErr } = await supabaseAdmin
      .from('razorpay_configuration')
      .select('*')
      .eq('mode', activeMode)
      .maybeSingle();

    if (rzpConfigErr || !rzpConfig || !rzpConfig.is_configured) {
      return res.status(400).json({ error: `Razorpay is not configured for mode: ${activeMode}.` });
    }

    const totalPaise = Math.round(Number(order.total) * 100);
    const razorpay = await getRazorpayClient(activeMode);

    // 6. Idempotency Check: check if order already has an eligible Razorpay Order ID
    if (order.razorpay_order_id && order.razorpay_mode === activeMode) {
      try {
        console.log(`[Idempotency] Verifying existing Razorpay Order: ${order.razorpay_order_id}`);
        const existingRzpOrder = await razorpay.orders.fetch(order.razorpay_order_id);
        
        // If the order exists, is still unpaid, and matches the expected total amount
        if (existingRzpOrder && Number(existingRzpOrder.amount) === totalPaise && existingRzpOrder.status === 'created') {
          console.log(`[Idempotency] Reusing existing Razorpay Order: ${order.razorpay_order_id}`);
          
          // Ensure payment_provider column is forced server-side to razorpay
          if (order.payment_provider !== 'razorpay') {
            await supabaseAdmin
              .from('website_store_orders')
              .update({ payment_provider: 'razorpay' })
              .eq('order_id', orderId);
          }

          return res.status(200).json({
            success: true,
            internalOrderId: order.order_id,
            razorpayOrderId: order.razorpay_order_id,
            amount: totalPaise,
            currency: 'INR',
            keyId: rzpConfig.key_id,
            mode: activeMode
          });
        }
      } catch (fetchErr) {
        console.log(`[Idempotency] Stored Razorpay Order ${order.razorpay_order_id} could not be resolved, creating new one.`, fetchErr.message);
      }
    }

    // 7. Create a new Razorpay Order
    const receiptId = `rcpt_${order.order_id.substring(0, 15)}`; // Razorpay receipt limit is 40 chars
    const rzOrder = await razorpay.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        order_id: order.order_id,
        user_id: devoteeId
      }
    });

    if (!rzOrder || !rzOrder.id) {
      throw new Error('Failed to create Razorpay Order response.');
    }

    // 8. Write Order ID and Provider options back to internal order database
    const { error: updateErr } = await supabaseAdmin
      .from('website_store_orders')
      .update({
        razorpay_order_id: rzOrder.id,
        razorpay_mode: activeMode,
        payment_provider: 'razorpay'
      })
      .eq('order_id', order.order_id);

    if (updateErr) {
      throw updateErr;
    }

    return res.status(200).json({
      success: true,
      internalOrderId: order.order_id,
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: rzpConfig.key_id,
      mode: activeMode
    });

  } catch (err) {
    console.error('[Admin Payments Create Order] Operation failed:', err);
    const errMsg = err instanceof Error ? err.message : (err && typeof err === 'object' ? JSON.stringify(err) : String(err));
    return res.status(500).json({ error: 'Internal error initializing payment transaction: ' + errMsg });
  }
}
