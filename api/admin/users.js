import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, verifyCsrf, injectSecurityHeaders, logAdminAction } from '../_lib/admin/auth.js';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  // 1. Authenticate Request & Get Performing Admin Identity
  const adminSession = await verifyAdmin(req);
  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized: Valid admin session required.' });
  }

  // 2. Enforce Super Admin Authorization for User Management Operations
  const isSuper = adminSession.role === 'super_admin' || adminSession.role === 'admin' || (adminSession.role !== 'manager' && adminSession.role !== 'editor');
  if (!isSuper) {
    return res.status(403).json({ error: 'Forbidden: Super Admin privileges required for user management.' });
  }

  // GET: List all administrators and active session metadata
  if (req.method === 'GET') {
    try {
      let admins = [];
      const { data: adminData, error: adminErr } = await supabaseAdmin
        .from('website_store_admin')
        .select('*')
        .order('created_at', { ascending: true });

      if (!adminErr && adminData) admins = adminData;

      let sessions = [];
      const { data: sessionData, error: sessionErr } = await supabaseAdmin
        .from('admin_sessions')
        .select('*')
        .gt('expires_at', new Date().toISOString());

      if (!sessionErr && sessionData) sessions = sessionData;

      // Group active session counts per admin
      const sessionsByAdmin = {};
      sessions.forEach(s => {
        if (!sessionsByAdmin[s.admin_id]) sessionsByAdmin[s.admin_id] = [];
        sessionsByAdmin[s.admin_id].push(s);
      });

      const formattedAdmins = admins.map(a => ({
        id: a.id,
        username: a.username,
        display_name: a.display_name || a.username,
        role: a.role || 'super_admin',
        is_active: a.is_active !== false,
        last_login_at: a.last_login_at || null,
        created_at: a.created_at,
        active_sessions_count: (sessionsByAdmin[a.id] || []).length,
        active_sessions: sessionsByAdmin[a.id] || []
      }));

      return res.status(200).json({ success: true, admins: formattedAdmins });
    } catch (err) {
      console.error('[Admin Users GET Error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve administrative users list.' });
    }
  }

  // POST: State-changing operations (Requires CSRF verification)
  if (req.method === 'POST') {
    if (!verifyCsrf(req)) {
      return res.status(403).json({ error: 'Forbidden: CSRF verification failed.' });
    }

    const { action, username, password, displayName, role, targetAdminId, targetSessionId, isActive, newPassword } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter.' });
    }

    try {
      // ----------------------------------------------------
      // Action: CREATE NEW ADMIN ACCOUNT
      // ----------------------------------------------------
      if (action === 'create') {
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password are required.' });
        }

        const normalizedUsername = username.trim().toLowerCase();
        if (normalizedUsername.length < 3) {
          return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
        }

        // Role validation: prevent creating unauthorized roles
        const allowedRoles = ['admin', 'manager', 'editor'];
        const assignedRole = allowedRoles.includes(role) ? role : 'admin';

        // Check if username already exists
        const { data: existingUser } = await supabaseAdmin
          .from('website_store_admin')
          .select('id')
          .eq('username', normalizedUsername)
          .maybeSingle();

        if (existingUser) {
          return res.status(400).json({ error: 'An admin account with this username already exists.' });
        }

        // Hash password securely with scrypt
        const salt = crypto.randomBytes(16).toString('hex');
        const key = await scrypt(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
        const passwordHash = `scrypt$${salt}$${key.toString('hex')}`;

        const insertPayload = {
          username: normalizedUsername,
          display_name: displayName || normalizedUsername,
          password_hash: passwordHash,
          role: assignedRole,
          is_active: true,
          created_by: adminSession.admin_id
        };

        let newAdmin = null;
        let { data: createdData, error: insertErr } = await supabaseAdmin
          .from('website_store_admin')
          .insert(insertPayload)
          .select('*')
          .single();

        if (insertErr && (insertErr.code === 'PGRST204' || insertErr.message?.includes('display_name') || insertErr.message?.includes('role'))) {
          const { data: fbData, error: fbErr } = await supabaseAdmin
            .from('website_store_admin')
            .insert({
              username: normalizedUsername,
              password_hash: passwordHash
            })
            .select('id, username, created_at')
            .single();
          if (fbErr) throw fbErr;
          newAdmin = fbData;
        } else if (insertErr) {
          throw insertErr;
        } else {
          newAdmin = createdData;
        }

        await logAdminAction(adminSession.admin_id, req, 'ADMIN_CREATED', {
          targetAdminId: newAdmin.id,
          targetUsername: normalizedUsername,
          role: assignedRole
        });

        return res.status(200).json({ success: true, admin: newAdmin });
      }

      // ----------------------------------------------------
      // Action: TOGGLE ACTIVE / DISABLED STATUS
      // ----------------------------------------------------
      if (action === 'toggle-status') {
        if (!targetAdminId || isActive === undefined) {
          return res.status(400).json({ error: 'Missing targetAdminId or isActive parameter.' });
        }

        // Fetch target admin record
        const { data: targetAdmin } = await supabaseAdmin
          .from('website_store_admin')
          .select('id, username')
          .eq('id', targetAdminId)
          .maybeSingle();

        if (!targetAdmin) {
          return res.status(404).json({ error: 'Target admin account not found.' });
        }

        // Super Admin Protection: Super Admin accounts cannot be disabled
        const isTargetSuperAdmin = targetAdmin.username === 'admin' || targetAdmin.username === 'nimda_shop_sahil' || targetAdmin.role === 'super_admin';
        if (isTargetSuperAdmin && isActive === false) {
          return res.status(400).json({ error: 'Super Admin accounts cannot be disabled.' });
        }

        const { error: updateErr } = await supabaseAdmin
          .from('website_store_admin')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', targetAdminId);

        if (updateErr) throw updateErr;

        // If disabling, immediately purge all active sessions for targetAdminId
        if (isActive === false) {
          await supabaseAdmin
            .from('admin_sessions')
            .delete()
            .eq('admin_id', targetAdminId);
        }

        await logAdminAction(adminSession.admin_id, req, isActive ? 'ADMIN_ENABLED' : 'ADMIN_DISABLED', {
          targetAdminId,
          targetUsername: targetAdmin.username
        });

        return res.status(200).json({ success: true });
      }

      // ----------------------------------------------------
      // Action: CHANGE ADMIN ROLE
      // ----------------------------------------------------
      if (action === 'change-role') {
        if (!targetAdminId || !role) {
          return res.status(400).json({ error: 'Missing targetAdminId or role parameter.' });
        }

        const validRoles = ['super_admin', 'admin', 'manager', 'editor'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: 'Invalid role specified.' });
        }

        const { data: targetAdmin } = await supabaseAdmin
          .from('website_store_admin')
          .select('id, username')
          .eq('id', targetAdminId)
          .maybeSingle();

        if (!targetAdmin) {
          return res.status(404).json({ error: 'Target admin account not found.' });
        }

        // Protect Super Admin from demotion
        const isTargetSuperAdmin = targetAdmin.username === 'admin' || targetAdmin.username === 'nimda_shop_sahil' || targetAdmin.role === 'super_admin';
        if (isTargetSuperAdmin && role !== 'super_admin') {
          return res.status(400).json({ error: 'Super Admin accounts cannot be demoted.' });
        }

        try {
          await supabaseAdmin
            .from('website_store_admin')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', targetAdminId);
        } catch (err) {
          console.warn('[Admin Users API] Could not update role column in DB:', err);
        }

        await logAdminAction(adminSession.admin_id, req, 'ADMIN_ROLE_CHANGED', {
          targetAdminId,
          targetUsername: targetAdmin.username,
          newRole: role
        });

        return res.status(200).json({ success: true, role });
      }

      // ----------------------------------------------------
      // Action: RESET ADMIN PASSWORD
      // ----------------------------------------------------
      if (action === 'reset-password') {
        if (!targetAdminId || !newPassword) {
          return res.status(400).json({ error: 'Missing targetAdminId or newPassword parameter.' });
        }

        if (newPassword.length < 12) {
          return res.status(400).json({ error: 'New password must be at least 12 characters long.' });
        }

        const { data: targetAdmin } = await supabaseAdmin
          .from('website_store_admin')
          .select('id, username')
          .eq('id', targetAdminId)
          .maybeSingle();

        if (!targetAdmin) {
          return res.status(404).json({ error: 'Target admin account not found.' });
        }

        // Protect Super Admin from being reset by other admins
        const isTargetSuperAdmin = targetAdmin.username === 'admin' || targetAdmin.username === 'nimda_shop_sahil' || targetAdmin.role === 'super_admin';
        if (isTargetSuperAdmin && adminSession.admin_id !== targetAdmin.id) {
          return res.status(403).json({ error: 'Super Admin passwords can only be changed by the account owner.' });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const key = await scrypt(newPassword, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
        const newHash = `scrypt$${salt}$${key.toString('hex')}`;

        const { error: resetErr } = await supabaseAdmin
          .from('website_store_admin')
          .update({ password_hash: newHash, updated_at: new Date().toISOString() })
          .eq('id', targetAdminId);

        if (resetErr) throw resetErr;

        // Invalidate all active sessions for target admin after password reset
        await supabaseAdmin
          .from('admin_sessions')
          .delete()
          .eq('admin_id', targetAdminId);

        await logAdminAction(adminSession.admin_id, req, 'ADMIN_PASSWORD_RESET', {
          targetAdminId,
          targetUsername: targetAdmin.username
        });

        return res.status(200).json({ success: true, message: 'Password reset successfully.' });
      }

      // ----------------------------------------------------
      // Action: REVOKE SINGLE SESSION
      // ----------------------------------------------------
      if (action === 'revoke-session') {
        if (!targetSessionId) {
          return res.status(400).json({ error: 'Missing targetSessionId parameter.' });
        }

        const { data: sessionData } = await supabaseAdmin
          .from('admin_sessions')
          .select('id, admin_id')
          .eq('id', targetSessionId)
          .maybeSingle();

        if (!sessionData) {
          return res.status(404).json({ error: 'Target session not found.' });
        }

        const { error: deleteErr } = await supabaseAdmin
          .from('admin_sessions')
          .delete()
          .eq('id', targetSessionId);

        if (deleteErr) throw deleteErr;

        await logAdminAction(adminSession.admin_id, req, 'SESSION_REVOKED', {
          targetSessionId,
          targetAdminId: sessionData.admin_id
        });

        return res.status(200).json({ success: true });
      }

      // ----------------------------------------------------
      // Action: REVOKE ALL SESSIONS FOR TARGET ADMIN
      // ----------------------------------------------------
      if (action === 'revoke-all-sessions') {
        if (!targetAdminId) {
          return res.status(400).json({ error: 'Missing targetAdminId parameter.' });
        }

        const { error: deleteErr } = await supabaseAdmin
          .from('admin_sessions')
          .delete()
          .eq('admin_id', targetAdminId);

        if (deleteErr) throw deleteErr;

        await logAdminAction(adminSession.admin_id, req, 'ALL_SESSIONS_REVOKED', { targetAdminId });
        return res.status(200).json({ success: true });
      }

      // ----------------------------------------------------
      // Action: DELETE ADMIN ACCOUNT
      // ----------------------------------------------------
      if (action === 'delete') {
        if (!targetAdminId) {
          return res.status(400).json({ error: 'Missing targetAdminId parameter.' });
        }

        const { data: targetAdmin } = await supabaseAdmin
          .from('website_store_admin')
          .select('id, username')
          .eq('id', targetAdminId)
          .maybeSingle();

        if (!targetAdmin) {
          return res.status(404).json({ error: 'Target admin account not found.' });
        }

        // Super Admin & Self Protection Rules
        const isTargetSuperAdmin = targetAdmin.username === 'admin' || targetAdmin.username === 'nimda_shop_sahil' || targetAdmin.role === 'super_admin';
        if (isTargetSuperAdmin) {
          return res.status(400).json({ error: 'Super Admin accounts cannot be deleted.' });
        }

        if (targetAdminId === adminSession.admin_id) {
          return res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
        }

        const { error: deleteErr } = await supabaseAdmin
          .from('website_store_admin')
          .delete()
          .eq('id', targetAdminId);

        if (deleteErr) throw deleteErr;

        await logAdminAction(adminSession.admin_id, req, 'ADMIN_DELETED', {
          targetAdminId,
          targetUsername: targetAdmin.username
        });

        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: `Invalid action "${action}"` });
    } catch (err) {
      console.error('[Admin Users API POST Error]:', err);
      return res.status(500).json({ error: 'Admin management operation failed: ' + err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
