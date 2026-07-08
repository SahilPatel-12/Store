import crypto from 'crypto';
import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { decryptTextServer } from '../_lib/crypto-server.js';

// Disable bodyParser so we can parse the raw request stream to verify the signature
export const config = {
  api: {
    bodyParser: false
  }
};

// Helper to read the request stream into a buffer
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).send('Missing signature header.');
  }

  try {
    const rawBody = await getRawBody(req);
    const rawBodyString = rawBody.toString('utf8');

    // 1. Fetch configurations to match webhook secrets
    const { data: configs, error: configErr } = await supabaseAdmin
      .from('razorpay_configuration')
      .select('*');

    if (configErr || !configs || configs.length === 0) {
      console.error('[Webhook] Failed to load Razorpay configurations:', configErr?.message);
      return res.status(500).send('Configuration error.');
    }

    let activeMode = null;
    let matchedConfig = null;

    // 2. Timing-safe verification fallback across configured modes
    for (const config of configs) {
      if (!config.encrypted_webhook_secret) continue;
      try {
        const webhookSecret = decryptTextServer(
          config.encrypted_webhook_secret,
          config.webhook_secret_iv,
          config.webhook_secret_auth_tag
        );

        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBodyString)
          .digest('hex');

        const bufExpected = Buffer.from(expectedSignature, 'hex');
        const bufActual = Buffer.from(signature, 'hex');

        if (bufExpected.length === bufActual.length && crypto.timingSafeEqual(bufExpected, bufActual)) {
          activeMode = config.mode;
          matchedConfig = config;
          break;
        }
      } catch (err) {
        console.warn(`[Webhook] Signature try failed for mode ${config.mode}:`, err.message);
      }
    }

    if (!activeMode) {
      console.warn('[Webhook] Signature authentication failed for all modes.');
      return res.status(400).send('Invalid signature.');
    }

    // 3. Parse JSON payload securely after signature authentication
    const payload = JSON.parse(rawBodyString);
    const eventType = payload.event;
    
    // We only process payment.captured for order confirm mutations
    if (eventType !== 'payment.captured') {
      console.log(`[Webhook] Ignoring unsupported event: ${eventType}`);
      return res.status(200).json({ success: true, message: 'Event ignored.' });
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment) {
      return res.status(400).send('Missing payment payload.');
    }

    const rzpOrderId = payment.order_id;
    const rzpPaymentId = payment.id;
    const paymentStatus = payment.status;

    if (!rzpOrderId || !rzpPaymentId || paymentStatus !== 'captured') {
      return res.status(400).send('Invalid payment payload parameter mapping.');
    }

    // Generate deduplication key using event_id or deterministically
    const deduplicationKey = payload.event_id || crypto
      .createHash('sha256')
      .update(`${eventType}_${rzpOrderId}_${rzpPaymentId}_${paymentStatus}`)
      .digest('hex');

    // 4. Webhook Event Idempotency: log the incoming webhook
    const { data: eventRecord, error: eventErr } = await supabaseAdmin
      .from('razorpay_webhook_events')
      .insert({
        deduplication_key: deduplicationKey,
        event_type: eventType,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        processing_status: 'Pending'
      })
      .select()
      .maybeSingle();

    // If duplicate event detected, return success immediately
    if (eventErr && eventErr.code === '23505') {
      console.log(`[Webhook] Duplicate event detected and skipped: ${deduplicationKey}`);
      return res.status(200).json({ success: true, message: 'Duplicate event already processed.' });
    }

    if (eventErr || !eventRecord) {
      throw new Error(`Failed to initialize webhook event logging: ${eventErr?.message}`);
    }

    // 5. Retrieve internal order using stored Razorpay Order ID
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('website_store_orders')
      .select('*')
      .eq('razorpay_order_id', rzpOrderId)
      .maybeSingle();

    if (orderErr || !order) {
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ processing_status: 'Failed', safe_error_code: 'ORDER_NOT_FOUND', processed_at: new Date().toISOString() })
        .eq('id', eventRecord.id);
      return res.status(200).json({ success: true, warning: 'Order not found.' });
    }

    // Validate parameters
    const expectedAmount = Math.round(Number(order.total) * 100);
    if (order.payment_provider !== 'razorpay' || Number(payment.amount) !== expectedAmount || payment.currency !== order.currency) {
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ processing_status: 'Failed', safe_error_code: 'PAYMENT_PARAMETERS_MISMATCH', processed_at: new Date().toISOString() })
        .eq('id', eventRecord.id);
      return res.status(200).json({ success: true, warning: 'Payment parameter mismatch.' });
    }

    // Verify RLS mode match context
    if (order.razorpay_mode !== activeMode) {
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ processing_status: 'Failed', safe_error_code: 'MODE_MISMATCH', processed_at: new Date().toISOString() })
        .eq('id', eventRecord.id);
      return res.status(200).json({ success: true, warning: 'Mode mismatch detected.' });
    }

    // Validate uniqueness of payment ID across other orders
    const { data: dupPayment } = await supabaseAdmin
      .from('website_store_orders')
      .select('order_id')
      .eq('razorpay_payment_id', rzpPaymentId)
      .neq('order_id', order.order_id)
      .maybeSingle();

    if (dupPayment) {
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ processing_status: 'Failed', safe_error_code: 'DUPLICATE_PAYMENT_ID_CROSS_ORDER', processed_at: new Date().toISOString() })
        .eq('id', eventRecord.id);
      return res.status(200).json({ success: true, warning: 'Payment ID is already captured on another order.' });
    }

    // 6. Monotonic check logic
    if (order.payment_status === 'Confirmed') {
      if (order.razorpay_payment_id === rzpPaymentId) {
        await supabaseAdmin
          .from('razorpay_webhook_events')
          .update({ processing_status: 'Processed', processed_at: new Date().toISOString() })
          .eq('id', eventRecord.id);
        return res.status(200).json({ success: true, message: 'Order already confirmed.' });
      }
      // If confirmed but has a different payment, do not overwrite, flag reconciliation
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ processing_status: 'Failed', safe_error_code: 'RECONCILIATION_CONFLICT', processed_at: new Date().toISOString() })
        .eq('id', eventRecord.id);
      return res.status(200).json({ success: true, warning: 'Conflict: Order already confirmed with different payment ID.' });
    }

    if (order.status === 'Cancelled') {
      // Do not restart fulfillment for cancelled orders
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ processing_status: 'Failed', safe_error_code: 'CANCELLED_ORDER_PAID_RECONCILIATION', processed_at: new Date().toISOString() })
        .eq('id', eventRecord.id);
      return res.status(200).json({ success: true, warning: 'Captured payment received for Cancelled order.' });
    }

    // 7. Update order state parameters
    const { error: updateErr } = await supabaseAdmin
      .from('website_store_orders')
      .update({
        payment_status: 'Confirmed',
        status: 'Being Packed',
        razorpay_payment_id: rzpPaymentId,
        amount_paid_paise: payment.amount,
        currency: payment.currency,
        payment_verified_at: new Date().toISOString()
      })
      .eq('order_id', order.order_id);

    if (updateErr) {
      throw updateErr;
    }

    // Update webhook event to processed
    await supabaseAdmin
      .from('razorpay_webhook_events')
      .update({
        processing_status: 'Processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', eventRecord.id);

    console.log(`[Webhook] Successfully reconciled order ${order.order_id} via payment ${rzpPaymentId}`);
    return res.status(200).json({ success: true, status: 'Confirmed' });

  } catch (err) {
    console.error('[Admin Webhook Exception] Processing failed:', err);
    return res.status(500).send('Internal server processing exception.');
  }
}
