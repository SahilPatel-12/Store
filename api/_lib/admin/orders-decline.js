import { verifyAdmin } from './auth.js';
import { supabaseAdmin } from '../supabase-admin.js';



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Missing order ID.' });
  }

  try {
    const isAdmin = !!(await verifyAdmin(req));
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

    // 2. Security validation (Omitted check to allow admin manual override for stuck Razorpay orders)

    if (order.payment_status === 'Confirmed') {
      return res.status(400).json({ error: 'Cannot decline an already confirmed order payment.' });
    }

    // 3. Increment decline count
    const nextDeclineCount = (order.payment_decline_count || 0) + 1;
    const shouldCancel = nextDeclineCount >= 3;

    // 4. Update order to decline and cancel if threshold reached
    const updatePayload = {
      payment_status: 'Declined',
      payment_decline_count: nextDeclineCount
    };

    if (shouldCancel) {
      updatePayload.status = 'Cancelled';
    }

    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('website_store_orders')
      .update(updatePayload)
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    console.log(`[Admin Legacy Decline] Order ${orderId} declined by admin. New decline count: ${nextDeclineCount}. Status: ${updatedOrder.status}`);
    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('[Admin Legacy Decline] Exception:', err);
    return res.status(500).json({ error: 'Failed to decline legacy order payment: ' + err.message });
  }
}
