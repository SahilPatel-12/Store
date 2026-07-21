import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { injectSecurityHeaders, logAdminAction, cleanupExpiredSessions } from '../_lib/admin/auth.js';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

// Constants for scrypt configuration matching setup
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

/**
 * Constant-time comparison wrapper for buffers to prevent timing attacks.
 * Pads inputs if length mismatches.
 */
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

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';

  try {
    // 1. IP-based rate limiting check
    const { data: lockoutRecord, error: lockoutErr } = await supabaseAdmin
      .from('admin_login_attempts')
      .select('*')
      .eq('ip_address', clientIp)
      .maybeSingle();

    if (lockoutRecord && lockoutRecord.locked_until) {
      const lockedTime = new Date(lockoutRecord.locked_until).getTime();
      if (Date.now() < lockedTime) {
        const minutesLeft = Math.ceil((lockedTime - Date.now()) / 60000);
        return res.status(429).json({ 
          error: `Too many failed attempts. This IP address is locked. Try again in ${minutesLeft} minutes.` 
        });
      }
    }

    // 2. Fetch administrative user row (case-insensitive username check)
    const normalizedUsername = username.trim().toLowerCase();
    const { data: adminUser, error: adminErr } = await supabaseAdmin
      .from('website_store_admin')
      .select('*')
      .eq('username', normalizedUsername)
      .maybeSingle();

    let isSuccess = false;

    if (!adminErr && adminUser) {
      // Check if account is active
      if (adminUser.is_active === false) {
        await logAdminAction(adminUser.id, req, 'LOGIN_FAILED_DISABLED', { username: normalizedUsername });
        return res.status(403).json({ error: 'This administrative account has been disabled. Please contact a Super Admin.' });
      }

      const storedHash = adminUser.password_hash;
      const parts = storedHash.split('$');
      if (parts[0] === 'scrypt') {
        const salt = parts[1];
        const keyHex = parts[2];
        const derivedKey = await scrypt(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
        
        isSuccess = safeCompare(derivedKey.toString('hex'), keyHex);
      }
    }

    if (isSuccess) {
      // 3. Reset rate limits and clean logs
      if (lockoutRecord) {
        await supabaseAdmin
          .from('admin_login_attempts')
          .update({ failed_count: 0, locked_until: null, updated_at: new Date().toISOString() })
          .eq('ip_address', clientIp);
      }

      // 4. Generate secure 64-byte token and insert SHA-256 hash (Supports concurrent multi-device logins)
      const token = crypto.randomBytes(64).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours session validity

      // Format clean device label from user agent
      const deviceLabel = userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser';

      let { error: sessionError } = await supabaseAdmin
        .from('admin_sessions')
        .insert({
          admin_id: adminUser.id,
          session_token_hash: tokenHash,
          ip_address: clientIp,
          user_agent: userAgent,
          device_label: deviceLabel,
          expires_at: expiresAt
        });

      // Fallback insert without device_label if PostgREST schema cache hasn't loaded the column yet
      if (sessionError && (sessionError.code === 'PGRST204' || sessionError.message?.includes('device_label'))) {
        console.warn('[Admin Login API] Fallback session insert without device_label:', sessionError.message);
        const { error: fallbackErr } = await supabaseAdmin
          .from('admin_sessions')
          .insert({
            admin_id: adminUser.id,
            session_token_hash: tokenHash,
            ip_address: clientIp,
            user_agent: userAgent,
            expires_at: expiresAt
          });
        if (fallbackErr) throw fallbackErr;
      } else if (sessionError) {
        throw sessionError;
      }

      // 5. Update last_login_at timestamp (safely)
      try {
        await supabaseAdmin
          .from('website_store_admin')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', adminUser.id);
      } catch (err) {
        console.warn('[Admin Login API] Ignore last_login_at update:', err);
      }

      // 6. Set Host-admin_session HttpOnly cookie
      res.setHeader(
        'Set-Cookie',
        `__Host-admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
      );

      // 7. Log audit event & clean old logs
      await logAdminAction(adminUser.id, req, 'LOGIN_SUCCESS', { username: normalizedUsername });
      await cleanupExpiredSessions();

      return res.status(200).json({ 
        success: true, 
        id: adminUser.id,
        username: adminUser.username, 
        display_name: adminUser.display_name || adminUser.username,
        role: adminUser.role || 'super_admin',
        token: token 
      });
    } else {
      // 8. Record failed login attempt and trigger rate lockout if count >= 5
      const currentFailed = (lockoutRecord?.failed_count || 0) + 1;
      let lockedUntil = null;
      if (currentFailed >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes lockout
      }

      await supabaseAdmin
        .from('admin_login_attempts')
        .upsert({
          ip_address: clientIp,
          failed_count: currentFailed,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString()
        });

      // Log failed audit log entry (adminUser.id is null since it wasn't authenticated)
      await logAdminAction(null, req, 'LOGIN_FAILED', { username: normalizedUsername, ip: clientIp });
      await cleanupExpiredSessions();

      return res.status(401).json({ error: 'Invalid username or password.' });
    }
  } catch (err) {
    console.error('[Admin Login API Exception]:', err);
    return res.status(500).json({ error: 'Internal Server Error during authentication.' });
  }
}
