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

  const { action, astrologer, userId, isAstrologer } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter.' });
  }

  try {
    if (action === 'create') {
      if (!astrologer || !userId) {
        return res.status(400).json({ error: 'Missing astrologer or userId parameter.' });
      }

      const { data, error: insertErr } = await supabaseAdmin
        .from('website_store_astrologers')
        .insert(astrologer)
        .select('*')
        .single();

      if (insertErr) throw insertErr;

      const { error: userErr } = await supabaseAdmin
        .from('website_store_users')
        .update({ is_astrologer: true })
        .eq('id', userId);

      if (userErr) throw userErr;

      await logAdminAction(adminSession.admin_id, req, 'ASTROLOGER_CREATE', { userId });
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete') {
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter.' });
      }

      const { error: deleteErr } = await supabaseAdmin
        .from('website_store_astrologers')
        .delete()
        .eq('user_id', userId);

      if (deleteErr) throw deleteErr;

      const { error: userErr } = await supabaseAdmin
        .from('website_store_users')
        .update({ is_astrologer: false })
        .eq('id', userId);

      if (userErr) throw userErr;

      await logAdminAction(adminSession.admin_id, req, 'ASTROLOGER_DELETE', { userId });
      return res.status(200).json({ success: true });
    }

    if (action === 'toggle-status') {
      if (!userId || isAstrologer === undefined) {
        return res.status(400).json({ error: 'Missing userId or isAstrologer parameter.' });
      }

      const { error: userErr } = await supabaseAdmin
        .from('website_store_users')
        .update({ is_astrologer: isAstrologer })
        .eq('id', userId);

      if (userErr) throw userErr;

      await logAdminAction(adminSession.admin_id, req, 'ASTROLOGER_TOGGLE_STATUS', { userId, isAstrologer });
      return res.status(200).json({ success: true });
    }

    if (action === 'delete-cascade') {
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter.' });
      }

      // Resolve admin session token
      let adminToken = req.body.adminToken || '';
      if (!adminToken) {
        const cookies = req.headers.cookie || '';
        const sessionCookie = cookies
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith('__Host-admin_session='));
        if (sessionCookie) {
          adminToken = sessionCookie.split('=')[1] || '';
        }
      }
      if (!adminToken) {
        adminToken = req.headers['x-admin-token'] || '';
      }
      if (!adminToken && req.headers['authorization']) {
        const parts = req.headers['authorization'].split(' ');
        adminToken = (parts.length === 2 && parts[0].toLowerCase() === 'bearer') ? parts[1] : req.headers['authorization'];
      }

      const { error: rpcErr } = await supabaseAdmin.rpc('admin_delete_user_cascade', {
        p_admin_token: adminToken,
        p_target_user_id: userId
      });

      if (rpcErr) throw rpcErr;

      await logAdminAction(adminSession.admin_id, req, 'USER_DELETE_CASCADE', { userId });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Invalid action "${action}"` });
  } catch (err) {
    console.error('[Admin Astrologers API Error]:', err);
    return res.status(500).json({ error: 'Astrologers operation failed: ' + err.message });
  }
}
