import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, verifyCsrf, injectSecurityHeaders, logAdminAction } from '../_lib/admin/auth.js';

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  const adminSession = await verifyAdmin(req);
  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
  }

  // GET: Fetch all website settings
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('website_settings')
        .select('*');

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('[Admin Settings GET Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch settings.' });
    }
  }

  // POST: Save settings (Requires CSRF)
  if (req.method === 'POST') {
    if (!verifyCsrf(req)) {
      return res.status(403).json({ error: 'Forbidden: CSRF verification failed.' });
    }

    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Missing key or value parameter.' });
    }

    try {
      const { error } = await supabaseAdmin
        .from('website_settings')
        .upsert({ key, value });

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'SETTINGS_UPDATE', { key });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[Admin Settings POST Error]:', err);
      return res.status(500).json({ error: 'Failed to update website settings.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
