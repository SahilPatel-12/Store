import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, verifyCsrf, injectSecurityHeaders, logAdminAction } from '../_lib/admin/auth.js';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function safeCompare(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 1. Verify CSRF
  if (!verifyCsrf(req)) {
    return res.status(403).json({ error: 'Forbidden: CSRF verification failed.' });
  }

  // 2. Verify Session
  const adminSession = await verifyAdmin(req);
  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 16) {
    return res.status(400).json({ error: 'New password must be at least 16 characters long.' });
  }

  try {
    // 3. Fetch admin record to verify current password
    const { data: adminUser, error: adminErr } = await supabaseAdmin
      .from('website_store_admin')
      .select('*')
      .eq('id', adminSession.admin_id)
      .maybeSingle();

    if (adminErr || !adminUser) {
      return res.status(500).json({ error: 'Error fetching administrative user.' });
    }

    const storedHash = adminUser.password_hash;
    const parts = storedHash.split('$');
    if (parts[0] !== 'scrypt') {
      return res.status(500).json({ error: 'Invalid password hashing scheme in database.' });
    }

    const salt = parts[1];
    const keyHex = parts[2];
    const derivedKey = await scrypt(currentPassword, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });

    const match = safeCompare(derivedKey.toString('hex'), keyHex);
    if (!match) {
      return res.status(401).json({ error: 'Invalid current password.' });
    }

    // 4. Hash new password securely with scrypt
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newKey = await scrypt(newPassword, newSalt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
    const newHash = `scrypt$${newSalt}$${newKey.toString('hex')}`;

    // 5. Update password in the database
    const { error: updateErr } = await supabaseAdmin
      .from('website_store_admin')
      .update({ password_hash: newHash })
      .eq('id', adminUser.id);

    if (updateErr) throw updateErr;

    // 6. Invalidate all active sessions for this admin (logout all devices)
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('admin_id', adminUser.id);

    // 7. Clear local authentication cookie
    res.setHeader(
      'Set-Cookie',
      '__Host-admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0'
    );

    // 8. Log the security audit log entry
    await logAdminAction(adminUser.id, req, 'PASSWORD_CHANGE_SUCCESS');

    return res.status(200).json({ success: true, message: 'Password updated successfully. Please login again.' });
  } catch (err) {
    console.error('[Admin Password Change API Exception]:', err);
    return res.status(500).json({ error: 'Internal Server Error during password change.' });
  }
}
