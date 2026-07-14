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

  const { action, withdrawalId, reason, transactionId, level, commissionPercent, settings, userId, status } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter.' });
  }

  try {
    // 1. Get Withdrawals
    if (action === 'get-withdrawals') {
      const { data, error } = await supabaseAdmin.rpc('admin_get_all_withdrawals', {
        p_admin_token: 'OBSOLETE' // Server-side bypass
      });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // 2. Approve Withdrawal
    if (action === 'approve-withdrawal') {
      if (!withdrawalId) return res.status(400).json({ error: 'Missing withdrawalId.' });
      const { data, error } = await supabaseAdmin.rpc('admin_approve_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      await logAdminAction(adminSession.admin_id, req, 'WITHDRAWAL_APPROVE', { withdrawalId });
      return res.status(200).json({ success: true, data });
    }

    // 3. Reject Withdrawal
    if (action === 'reject-withdrawal') {
      if (!withdrawalId) return res.status(400).json({ error: 'Missing withdrawalId.' });
      const { data, error } = await supabaseAdmin.rpc('admin_reject_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_notes: reason || '',
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      await logAdminAction(adminSession.admin_id, req, 'WITHDRAWAL_REJECT', { withdrawalId, reason });
      return res.status(200).json({ success: true, data });
    }

    // 4. Pay Withdrawal
    if (action === 'pay-withdrawal') {
      if (!withdrawalId || !transactionId) return res.status(400).json({ error: 'Missing withdrawalId or transactionId.' });
      const { data, error } = await supabaseAdmin.rpc('admin_mark_withdrawal_paid', {
        p_withdrawal_id: withdrawalId,
        p_tx_id: transactionId,
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      await logAdminAction(adminSession.admin_id, req, 'WITHDRAWAL_PAY', { withdrawalId, transactionId });
      return res.status(200).json({ success: true, data });
    }

    // 5. Get Affiliate Levels
    if (action === 'get-levels') {
      const { data, error } = await supabaseAdmin.rpc('admin_get_all_affiliate_levels', {
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // 6. Save Affiliate Level
    if (action === 'save-level') {
      if (level === undefined || commissionPercent === undefined) return res.status(400).json({ error: 'Missing level or commissionPercent.' });
      const { data, error } = await supabaseAdmin.rpc('admin_save_affiliate_level', {
        p_level: level,
        p_commission_percent: commissionPercent,
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      await logAdminAction(adminSession.admin_id, req, 'AFFILIATE_LEVEL_SAVE', { level, commissionPercent });
      return res.status(200).json({ success: true, data });
    }

    // 7. Delete Affiliate Level
    if (action === 'delete-level') {
      if (level === undefined) return res.status(400).json({ error: 'Missing level.' });
      const { data, error } = await supabaseAdmin.rpc('admin_delete_affiliate_level', {
        p_level: level,
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      await logAdminAction(adminSession.admin_id, req, 'AFFILIATE_LEVEL_DELETE', { level });
      return res.status(200).json({ success: true, data });
    }

    // 8. Get Affiliate Settings
    if (action === 'get-affiliate-settings') {
      const { data, error } = await supabaseAdmin.rpc('admin_get_all_affiliate_settings', {
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // 9. Save Affiliate Settings
    if (action === 'save-affiliate-settings') {
      if (!settings) return res.status(400).json({ error: 'Missing settings payload.' });
      const { data, error } = await supabaseAdmin.rpc('admin_save_affiliate_settings', {
        p_settings_json: settings,
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      await logAdminAction(adminSession.admin_id, req, 'AFFILIATE_SETTINGS_SAVE');
      return res.status(200).json({ success: true, data });
    }

    // 10. Set Affiliate Status
    if (action === 'set-affiliate-status') {
      if (!userId || !status) return res.status(400).json({ error: 'Missing userId or status.' });
      const { data, error } = await supabaseAdmin.rpc('admin_set_affiliate_status', {
        p_user_id: userId,
        p_status: status,
        p_admin_token: 'OBSOLETE'
      });
      if (error) throw error;
      await logAdminAction(adminSession.admin_id, req, 'AFFILIATE_STATUS_UPDATE', { userId, status });
      return res.status(200).json({ success: true, data });
    }

    return res.status(400).json({ error: `Invalid action "${action}"` });
  } catch (err) {
    console.error('[Admin Withdrawals API Error]:', err);
    return res.status(500).json({ error: 'Withdrawals operation failed: ' + err.message });
  }
}
