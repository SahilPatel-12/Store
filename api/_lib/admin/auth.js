import { supabaseAdmin } from '../supabase-admin.js';
import crypto from 'crypto';

/**
 * Validates the admin session token from the secure __Host-admin_session HttpOnly cookie.
 * Performs a constant-time comparison on the SHA-256 hash of the token.
 * 
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<{ id: string, admin_id: string } | null>}
 */
export async function verifyAdmin(req) {
  let token = '';

  // 1. Read from cookie
  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('__Host-admin_session='));
  if (sessionCookie) {
    token = sessionCookie.split('=')[1] || '';
  }

  // 2. Fallback to custom header
  if (!token) {
    token = req.headers['x-admin-token'] || '';
  }

  // 3. Fallback to standard authorization header
  if (!token && req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    } else {
      token = req.headers['authorization'];
    }
  }

  // 4. Fallback to query parameter
  if (!token && req.query && req.query.adminToken) {
    token = req.query.adminToken;
  }

  // 5. Fallback to request body parameter
  if (!token && req.body && req.body.adminToken) {
    token = req.body.adminToken;
  }

  if (!token) return null;

  // Compute SHA-256 hash of the provided cookie token
  const computedHash = crypto.createHash('sha256').update(token).digest('hex');

  // Fetch the active session from the database
  // Note: We retrieve session_token_hash to compare in timing-safe manner
  const { data, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, admin_id, session_token_hash')
    .gt('expires_at', new Date().toISOString());

  if (error || !data || data.length === 0) return null;

  const computedHashBuf = Buffer.from(computedHash, 'hex');

  // Compare in constant-time with timingSafeEqual
  for (const session of data) {
    const dbHashBuf = Buffer.from(session.session_token_hash, 'hex');
    if (
      computedHashBuf.length === dbHashBuf.length &&
      crypto.timingSafeEqual(computedHashBuf, dbHashBuf)
    ) {
      // Load administrative user details & verify status (resilient to schema cache)
      let adminUser = null;
      try {
        const { data, error } = await supabaseAdmin
          .from('website_store_admin')
          .select('*')
          .eq('id', session.admin_id)
          .maybeSingle();
        if (!error && data) adminUser = data;
      } catch (e) {}

      if (!adminUser) {
        const { data } = await supabaseAdmin
          .from('website_store_admin')
          .select('id, username')
          .eq('id', session.admin_id)
          .maybeSingle();
        adminUser = data;
      }

      if (!adminUser || adminUser.is_active === false) {
        return null;
      }

      // Touch last activity
      try {
        await supabaseAdmin
          .from('admin_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', session.id);
      } catch (e) {}

      return {
        session_id: session.id,
        admin_id: adminUser.id,
        username: adminUser.username,
        display_name: adminUser.display_name || adminUser.username,
        role: (adminUser.role === 'manager' || adminUser.role === 'editor') ? adminUser.role : 'super_admin',
        is_active: adminUser.is_active !== false,
        // Legacy compatibility alias
        id: session.id
      };
    }
  }

  return null;
}

/**
 * Enforces strict Origin/Referer header verification on state-changing requests to block CSRF.
 * 
 * @param {import('http').IncomingMessage} req
 * @returns {boolean} True if CSRF validation passes, otherwise False.
 */
export function verifyCsrf(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return true;
  }

  const origin = req.headers.origin || req.headers.referer || '';
  const host = req.headers.host || '';

  if (!origin) return false;

  try {
    const originUrl = new URL(origin, `http://${host}`);
    // Check if hostname and port match exactly
    return originUrl.host === host;
  } catch (e) {
    return false;
  }
}

/**
 * Injects production-grade security headers to the HTTP response.
 * 
 * @param {import('http').ServerResponse} res
 */
export function injectSecurityHeaders(res) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';"
  );
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

/**
 * Inserts a record into the admin audit logs table.
 * 
 * @param {string|null} adminId
 * @param {import('http').IncomingMessage} req
 * @param {string} action
 * @param {object} metadata
 */
export async function logAdminAction(adminId, req, action, metadata = {}) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || '';

  // Clean metadata of any sensitive keys before logging
  const cleanMetadata = { ...metadata };
  const sensitiveKeys = ['password', 'currentPassword', 'newPassword', 'token', 'session_token'];
  for (const key of sensitiveKeys) {
    if (key in cleanMetadata) {
      cleanMetadata[key] = '[REDACTED]';
    }
  }

  await supabaseAdmin.from('admin_audit_logs').insert({
    admin_id: adminId || null,
    ip_address: ip,
    user_agent: ua,
    action,
    metadata: cleanMetadata
  });
}

/**
 * Automatically purges expired sessions and old audit logs from the database.
 */
export async function cleanupExpiredSessions() {
  try {
    const nowStr = new Date().toISOString();
    // 1. Delete expired sessions
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .lt('expires_at', nowStr);

    // 2. Delete audit logs older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('admin_audit_logs')
      .delete()
      .lt('created_at', ninetyDaysAgo);
  } catch (err) {
    console.error('[Session/Audit Cleanup Error]:', err);
  }
}
