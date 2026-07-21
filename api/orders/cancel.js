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

    // 2. Safely delete the pending order
    const { data: deletedOrder, error: deleteError } = await supabaseAdmin
      .from('website_store_orders')
      .delete()
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .eq('status', 'Payment Pending')
      .select('*')
      .maybeSingle();

    if (deleteError) {
      console.error('[Cancel Order] Delete Error:', deleteError);
      throw deleteError;
    }

    if (!deletedOrder) {
      console.log(`[Cancel Order] No pending order found or already deleted: ${orderId}`);
      return res.status(200).json({ success: true, message: 'No pending order found to cancel.' });
    }

    console.log(`[Cancel Order] Successfully deleted pending checkout order: ${orderId}`);
    return res.status(200).json({ success: true, message: 'Pending order successfully cancelled.' });

  } catch (err) {
    console.error('[Cancel Order] Exception:', err);
    return res.status(500).json({ error: 'Order cancellation failed: ' + err.message });
  }
}
