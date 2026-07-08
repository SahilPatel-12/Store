import { supabaseAdmin } from '../../_lib/supabase-admin.js';

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
    return res.status(450).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { orderId, status, adminToken } = req.body;

  if (!orderId || !status || !adminToken) {
    return res.status(400).json({ error: 'Missing order ID, status, or admin token.' });
  }

  // Strict field value allowlist validation
  const allowedStatuses = ['Being Packed', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid order status. Must be one of: ${allowedStatuses.join(', ')}` });
  }

  try {
    const isAdmin = await verifyAdmin(adminToken);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
    }

    // Update order status
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('website_store_orders')
      .update({ status })
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    console.log(`[Admin Delivery Update] Order ${orderId} status set to "${status}" by admin.`);
    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('[Admin Delivery Update] Exception:', err);
    return res.status(500).json({ error: 'Failed to update order status: ' + err.message });
  }
}
