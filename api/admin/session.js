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

    // Retrieve username for frontend context matching
    const { data: adminUser } = await supabaseAdmin
      .from('website_store_admin')
      .select('username')
      .eq('id', adminSession.admin_id)
      .maybeSingle();

    const username = adminUser ? adminUser.username : 'admin';

    // Strictly conforms to security guidelines: zero token exposure to client-side JS
    return res.status(200).json({ 
      authenticated: true, 
      username
    });
  } catch (err) {
    console.error('[Admin Session Verification Exception]:', err);
    return res.status(200).json({ authenticated: false });
  }
}
