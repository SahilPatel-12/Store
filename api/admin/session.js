import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, injectSecurityHeaders } from '../_lib/admin/auth.js';

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const adminSession = await verifyAdmin(req);
    if (!adminSession) {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({ 
      authenticated: true, 
      id: adminSession.admin_id,
      username: adminSession.username,
      display_name: adminSession.display_name,
      role: adminSession.role,
      is_active: adminSession.is_active,
      session_id: adminSession.session_id
    });
  } catch (err) {
    console.error('[Admin Session Verification Exception]:', err);
    return res.status(200).json({ authenticated: false });
  }
}
