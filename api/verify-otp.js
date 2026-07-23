import { supabaseAdmin } from './_lib/supabase-admin.js';
import crypto from 'crypto';

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

export default async function handler(req, res) {
  // Ensure POST request
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone, otp, device_id } = req.body || {};
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Missing phone number or verification code.' });
  }

  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const deviceId = device_id || 'browser_client';

  const cleanPhone = phone.replace(/[^\d]/g, '');
  let formattedPhone = cleanPhone;
  if (formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }

  try {
    // ==========================================
    // Security Check: Localhost Dev OTP Bypass
    // Only active when running on localhost AND DEV_OTP_BYPASS_CODE is set in .env.local
    // ==========================================
    const reqHost = req.headers['host'] || req.headers['x-forwarded-host'] || '';
    const isLocalhostEnv = (
      process.env.NODE_ENV !== 'production' &&
      (ipAddress === '127.0.0.1' || ipAddress === '::1' || reqHost.includes('localhost') || reqHost.includes('127.0.0.1'))
    );
    const devBypassCode = process.env.DEV_OTP_BYPASS_CODE || process.env.VITE_DEV_OTP_BYPASS_CODE;
    const isDevBypassMatch = Boolean(isLocalhostEnv && devBypassCode && otp === devBypassCode);

    if (!isDevBypassMatch) {
      // 1. Fetch latest active OTP record within the 5-minute expiry window
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: record, error: fetchErr } = await supabaseAdmin
        .from('website_store_msg91_test_otps')
        .select('*')
        .eq('phone_number', formattedPhone)
        .is('used_at', null)
        .gt('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        console.error('[verify-otp] Database fetch error:', fetchErr);
        return res.status(500).json({ error: 'Database connection failed.' });
      }

      if (!record) {
        return res.status(400).json({ error: 'Access Denied: No active verification session found.' });
      }

      // 2. Enforce brute-force threshold lockout (max 5 attempts)
      if (record.attempt_count >= 5) {
        return res.status(400).json({ error: 'Access Denied: Too many failed verification attempts.' });
      }

      // 3. Increment database attempt counter
      const currentAttempts = (record.attempt_count || 0) + 1;
      await supabaseAdmin
        .from('website_store_msg91_test_otps')
        .update({ attempt_count: currentAttempts })
        .eq('id', record.id);

      // 4. Compare entered OTP code
      if (otp !== record.otp_hash) {
        return res.status(400).json({ error: 'Access Denied: Invalid OTP verification code.' });
      }

      // 5. Mark the code as verified/used
      await supabaseAdmin
        .from('website_store_msg91_test_otps')
        .update({ used_at: new Date().toISOString() })
        .eq('id', record.id);
    } else {
      console.log(`[verify-otp] ⚡ Local Dev OTP Bypass executed for phone: ${formattedPhone}`);
    }

    // 6. Retrieve or auto-create devotee user record
    let user;
    const { data: existingUser, error: userErr } = await supabaseAdmin
      .from('website_store_users')
      .select('*')
      .eq('phone_number', formattedPhone)
      .maybeSingle();

    if (userErr) {
      console.error('[verify-otp] Database user fetch error:', userErr);
      return res.status(500).json({ error: 'Devotee account lookup failed.' });
    }

    if (!existingUser) {
      // Auto-create new devotee account
      const { data: newUser, error: createErr } = await supabaseAdmin
        .from('website_store_users')
        .insert({
          full_name: '',
          phone_number: formattedPhone,
          password_hash: '',
          last_login_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (createErr) {
        console.error('[verify-otp] Failed to create devotee profile:', createErr);
        return res.status(500).json({ error: 'Account registration failed.' });
      }
      user = newUser;
    } else {
      if (existingUser.is_suspended) {
        return res.status(403).json({ error: 'Access Denied: Your account has been suspended.' });
      }
      user = existingUser;
    }

    // 7. Generate secure session token (32 cryptographically secure hex bytes)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 8. Prune old sessions (keep latest 4 sessions)
    const { data: oldSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('user_id', user.id)
      .order('last_activity', { ascending: false });

    if (oldSessions && oldSessions.length >= 4) {
      const idsToDelete = oldSessions.slice(3).map(s => s.id);
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .in('id', idsToDelete);
    }

    // 9. Create new session with dynamic IP and User-Agent binding
    const { error: sessionErr } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        device_id: deviceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt
      });

    if (sessionErr) {
      console.error('[verify-otp] Failed to create user session:', sessionErr);
      return res.status(500).json({ error: 'Session generation failed.' });
    }

    // 10. Update last login timestamp
    await supabaseAdmin
      .from('website_store_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // 11. Return authenticated profile to client
    return res.status(200).json({
      success: true,
      session_token: sessionToken,
      user_id: user.id,
      full_name: user.full_name || '',
      email: user.email || '',
      phone_number: user.phone_number
    });

  } catch (err) {
    console.error('[verify-otp] Internal server error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
