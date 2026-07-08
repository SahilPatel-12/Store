import crypto from 'crypto';
import { supabaseAdmin } from '../../_lib/supabase-admin.js';
import { getRazorpayClient } from '../../_lib/razorpay-client.js';
import { decryptTextServer } from '../../_lib/crypto-server.js';

// Verify devotee session
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

  const { sessionToken, orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};

  if (!sessionToken || !orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required parameters for verification.' });
  }

  try {
    // 1. Verify Devotee Session
    const devoteeId = await verifySession(sessionToken);
    if (!devoteeId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired customer session.' });
    }

    // 2. Fetch the internal order
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

    // 4. Verify order configuration
    if (order.payment_provider !== 'razorpay') {
      return res.status(400).json({ error: 'Order is not configured for Razorpay payment.' });
    }

    // 5. Check if order is already confirmed
    if (order.payment_status === 'Confirmed') {
      if (order.razorpay_payment_id === razorpay_payment_id) {
        return res.status(200).json({ success: true, status: 'Confirmed', message: 'Order already verified.' });
      }
      return res.status(409).json({ error: 'Order already confirmed with a different payment ID.' });
    }

    if (order.status === 'Cancelled') {
      return res.status(409).json({ error: 'Cannot confirm payment: Order has been Cancelled.' });
    }

    // 6. Verify submitted Razorpay Order ID matches stored value
    if (order.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order ID mismatch: browser-provided ID does not match server-created ID.' });
    }

    // 7. Load Razorpay mode credentials and decrypt Key Secret
    const mode = order.razorpay_mode;
    const { data: rzpConfig, error: configErr } = await supabaseAdmin
      .from('razorpay_configuration')
      .select('*')
      .eq('mode', mode)
      .single();

    if (configErr || !rzpConfig) {
      throw new Error(`Failed to load configuration keys for mode: ${mode}`);
    }

    let keySecret;
    try {
      keySecret = decryptTextServer(rzpConfig.encrypted_key_secret, rzpConfig.key_secret_iv, rzpConfig.key_secret_auth_tag);
    } catch (decErr) {
      throw new Error('Failed to decrypt Razorpay Key Secret server-side.');
    }

    // 8. Timing-safe HMAC SHA-256 signature verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(order.razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const bufExpected = Buffer.from(expectedSignature, 'hex');
    const bufActual = Buffer.from(razorpay_signature, 'hex');

    if (bufExpected.length !== bufActual.length || !crypto.timingSafeEqual(bufExpected, bufActual)) {
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    // 9. Fetch payment details directly from Razorpay to verify capturing status and parameters
    const razorpay = await getRazorpayClient(mode);
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!payment || payment.order_id !== order.razorpay_order_id) {
      return res.status(400).json({ error: 'Payment details do not match the expected Razorpay Order.' });
    }

    if (payment.status !== 'captured') {
      return res.status(400).json({ error: `Payment is not successfully captured. Status: ${payment.status}` });
    }

    const expectedTotalPaise = Math.round(Number(order.total) * 100);
    if (Number(payment.amount) !== expectedTotalPaise) {
      return res.status(400).json({ error: 'monetary amount mismatch. Expected ' + expectedTotalPaise + ' paise, received ' + payment.amount });
    }

    if (payment.currency !== 'INR') {
      return res.status(400).json({ error: `Currency mismatch. Expected INR, received ${payment.currency}` });
    }

    // 10. Check if this payment ID has already been attached to another order
    const { data: duplicate } = await supabaseAdmin
      .from('website_store_orders')
      .select('order_id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .neq('order_id', orderId)
      .maybeSingle();

    if (duplicate) {
      return res.status(400).json({ error: 'Duplicate verification: This payment ID is already confirmed on another order.' });
    }

    // 11. Complete order payment confirmation
    const { error: updateErr } = await supabaseAdmin
      .from('website_store_orders')
      .update({
        payment_status: 'Confirmed',
        status: 'Being Packed',
        razorpay_payment_id,
        amount_paid_paise: payment.amount,
        currency: payment.currency,
        payment_verified_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (updateErr) {
      throw updateErr;
    }

    return res.status(200).json({
      success: true,
      status: 'Confirmed',
      message: 'Payment verified and order confirmed successfully.'
    });

  } catch (err) {
    console.error('[Admin Payments Verify] Operation failed:', err);
    return res.status(500).json({ error: 'Internal server error verifying transaction: ' + err.message });
  }
}
