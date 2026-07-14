import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, verifyCsrf, injectSecurityHeaders, logAdminAction } from '../_lib/admin/auth.js';

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  // 1. Verify Session
  const adminSession = await verifyAdmin(req);
  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
  }

  // 2. GET request: List all orders
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('website_store_orders')
        .select('*')
        .neq('status', 'Payment Pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('[Admin Orders API GET Error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve orders list.' });
    }
  }

  // 3. POST request: Mutations (Requires CSRF protection)
  if (req.method === 'POST') {
    if (!verifyCsrf(req)) {
      return res.status(403).json({ error: 'Forbidden: CSRF verification failed.' });
    }

    const { action, orderId, status } = req.body;
    if (!action || !orderId) {
      return res.status(400).json({ error: 'Missing action or orderId parameter.' });
    }

    try {
      if (action === 'update-delivery-status') {
        const allowedStatuses = ['Being Packed', 'Shipped', 'Delivered', 'Cancelled'];
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ error: `Invalid order status. Must be one of: ${allowedStatuses.join(', ')}` });
        }

        const { data: updatedOrder, error: updateErr } = await supabaseAdmin
          .from('website_store_orders')
          .update({ status })
          .eq('order_id', orderId)
          .select('*')
          .single();

        if (updateErr) throw updateErr;

        await logAdminAction(adminSession.admin_id, req, 'ORDER_UPDATE_STATUS', { orderId, status });
        return res.status(200).json({ success: true, order: updatedOrder });
      }

      if (action === 'confirm-legacy-payment') {
        const { data: updatedOrder, error: confirmErr } = await supabaseAdmin
          .from('website_store_orders')
          .update({
            payment_status: 'Confirmed',
            status: 'Being Packed',
            payment_verified_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .select('*')
          .single();

        if (confirmErr) throw confirmErr;

        await logAdminAction(adminSession.admin_id, req, 'ORDER_CONFIRM_PAYMENT', { orderId });
        return res.status(200).json({ success: true, order: updatedOrder });
      }

      if (action === 'decline-legacy-payment') {
        const { data: updatedOrder, error: declineErr } = await supabaseAdmin
          .from('website_store_orders')
          .update({
            payment_status: 'Failed',
            status: 'Cancelled',
            payment_verified_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .select('*')
          .single();

        if (declineErr) throw declineErr;

        await logAdminAction(adminSession.admin_id, req, 'ORDER_DECLINE_PAYMENT', { orderId });
        return res.status(200).json({ success: true, order: updatedOrder });
      }

      return res.status(400).json({ error: `Invalid action "${action}"` });
    } catch (err) {
      console.error('[Admin Orders API POST Error]:', err);
      return res.status(500).json({ error: 'Order update failed: ' + err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
