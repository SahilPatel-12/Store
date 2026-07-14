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

  const { action, pundit, punditId, password, params } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter.' });
  }

  try {
    if (action === 'create') {
      const { data, error } = await supabaseAdmin.rpc('admin_create_pundit', params);
      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PUNDIT_CREATE', { username: params.p_username });
      return res.status(200).json({ success: true, data });
    }

    if (action === 'update') {
      if (!pundit || !punditId) {
        return res.status(400).json({ error: 'Missing pundit or punditId parameter.' });
      }

      const { data, error } = await supabaseAdmin
        .from('website_store_pundits')
        .update(pundit)
        .eq('id', punditId)
        .select('*')
        .single();

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PUNDIT_UPDATE', { punditId });
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete') {
      if (!punditId) {
        return res.status(400).json({ error: 'Missing punditId parameter.' });
      }

      const { error } = await supabaseAdmin
        .from('website_store_pundits')
        .delete()
        .eq('id', punditId);

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PUNDIT_DELETE', { punditId });
      return res.status(200).json({ success: true });
    }

    if (action === 'update-password') {
      const { error } = await supabaseAdmin.rpc('admin_update_pundit_password', {
        p_pundit_id: punditId,
        p_new_password: password
      });
      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PUNDIT_PASSWORD_UPDATE', { punditId });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Invalid action "${action}"` });
  } catch (err) {
    console.error('[Admin Pundits API Error]:', err);
    return res.status(500).json({ error: 'Pundits operation failed: ' + err.message });
  }
}
