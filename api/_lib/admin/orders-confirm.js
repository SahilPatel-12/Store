import { supabaseAdmin } from '../supabase-admin.js';

async function verifyAdmin(token) {
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  return !!data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { orderId, adminToken } = req.body;

  if (!orderId || !adminToken) {
    return res.status(400).json({ error: 'Missing order ID or admin token.' });
  }

  try {
    const isAdmin = await verifyAdmin(adminToken);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
    }

    // 1. Fetch order details
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('website_store_orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchErr || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // 2. Security validation: Verify payment provider is legacy manual_upi
    if (order.payment_provider !== 'manual_upi') {
      return res.status(403).json({ error: 'Forbidden: Cannot manually confirm payment for automated payment gateways.' });
    }

    // 3. Confirm only Pending or Declined legacy payments
    if (order.payment_status === 'Confirmed') {
      return res.status(400).json({ error: 'Order payment is already confirmed.' });
    }

    // 4. Update order to confirmed and set packing status
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('website_store_orders')
      .update({
        payment_status: 'Confirmed',
        status: 'Being Packed'
      })
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    console.log(`[Admin Legacy Confirm] Order ${orderId} confirmed successfully by admin.`);
    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('[Admin Legacy Confirm] Exception:', err);
    return res.status(500).json({ error: 'Failed to confirm legacy order payment: ' + err.message });
  }
}
