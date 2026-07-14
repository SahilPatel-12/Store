import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, verifyCsrf, injectSecurityHeaders, logAdminAction } from '../_lib/admin/auth.js';

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  const adminSession = await verifyAdmin(req);
  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Enforce CSRF protection
  if (!verifyCsrf(req)) {
    return res.status(403).json({ error: 'Forbidden: CSRF verification failed.' });
  }

  const { action, bookingId, booking } = req.body;
  if (!action || !bookingId) {
    return res.status(400).json({ error: 'Missing action or bookingId parameter.' });
  }

  try {
    if (action === 'update') {
      if (!booking) {
        return res.status(400).json({ error: 'Missing booking payload.' });
      }

      const { data, error } = await supabaseAdmin
        .from('website_store_pundit_bookings')
        .update(booking)
        .eq('id', bookingId)
        .select('*')
        .single();

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'BOOKING_UPDATE', { bookingId });
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin
        .from('website_store_pundit_bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'BOOKING_DELETE', { bookingId });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Invalid action "${action}"` });
  } catch (err) {
    console.error('[Admin Bookings API Error]:', err);
    return res.status(500).json({ error: 'Bookings operation failed: ' + err.message });
  }
}
