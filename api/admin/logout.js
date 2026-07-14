import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, injectSecurityHeaders, logAdminAction, cleanupExpiredSessions } from '../_lib/admin/auth.js';

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const adminSession = await verifyAdmin(req);
    if (adminSession) {
      // Invalidate the session in database
      await supabaseAdmin
        .from('admin_sessions')
        .delete()
        .eq('id', adminSession.id);

      await logAdminAction(adminSession.admin_id, req, 'LOGOUT_SUCCESS');
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
