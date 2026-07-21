import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, verifyCsrf, injectSecurityHeaders, logAdminAction, cleanupExpiredSessions } from '../_lib/admin/auth.js';

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 1. Enforce CSRF protection
  if (!verifyCsrf(req)) {
    return res.status(403).json({ error: 'Forbidden: CSRF verification failed.' });
  }

  try {
    const adminSession = await verifyAdmin(req);
    const { action } = req.body || {};

    if (adminSession) {
      if (action === 'logout-all') {
        // Purge ALL active sessions for this admin user across all devices
        await supabaseAdmin
          .from('admin_sessions')
          .delete()
          .eq('admin_id', adminSession.admin_id);

        await logAdminAction(adminSession.admin_id, req, 'LOGOUT_ALL_SESSIONS');
      } else {
        // Invalidate ONLY the current device session ID
        await supabaseAdmin
          .from('admin_sessions')
          .delete()
          .eq('id', adminSession.session_id);

        await logAdminAction(adminSession.admin_id, req, 'LOGOUT_SUCCESS');
      }
    }

    // Explicitly overwrite Host-admin_session cookie to expire immediately
    res.setHeader(
      'Set-Cookie',
      '__Host-admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0'
    );

    await cleanupExpiredSessions();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Admin Logout API Exception]:', err);
    return res.status(500).json({ error: 'Internal Server Error during logout.' });
  }
}
