import { supabaseAdmin } from '../_lib/supabase-admin.js';
import crypto from 'crypto';

async function verifyAdmin(token) {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, admin_id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing admin token.' });
  }

  const { phone, otp } = req.body || {};
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Missing phone number or OTP code.' });
  }

  try {
    // 1. Verify Admin Session
    const adminSession = await verifyAdmin(adminToken);
    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session.' });
    }

    // 2. Normalize phone number
    const normalizeIndianPhone = (phoneStr) => {
      const cleaned = phoneStr.replace(/[^\d+]/g, '');
      let digits = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
      if (digits.startsWith('91') && digits.length === 12) {
        return digits;
      }
      if (digits.startsWith('0') && digits.length === 11) {
        return '91' + digits.substring(1);
      }
      if (digits.length === 10) {
        return '91' + digits;
      }
      return null;
    };

    const formattedPhone = normalizeIndianPhone(phone);
    if (!formattedPhone) {
      return res.status(400).json({ error: 'Invalid Indian phone number format.' });
    }

    // 3. Query the latest test OTP record for this admin and phone number
    const { data: testOtp, error: selectErr } = await supabaseAdmin
      .from('website_store_msg91_test_otps')
      .select('*')
      .eq('admin_id', adminSession.id)
      .eq('phone_number', formattedPhone)
      .maybeSingle();

    if (selectErr) {
      console.error('[test-msg91-verify] Select failed:', selectErr);
      return res.status(500).json({ error: 'Database failed to query test OTP state.' });
    }

    if (!testOtp) {
      return res.status(404).json({ error: 'No active test OTP request found.' });
    }

    // 4. Validate record state (expiry, use, attempts)
    if (testOtp.used_at) {
      return res.status(400).json({ error: 'OTP has already been verified and used.' });
    }

    const now = new Date();
    const expiresAt = new Date(testOtp.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ error: 'OTP request has expired. Please send a new code.' });
    }

    if (testOtp.attempt_count >= 3) {
      return res.status(400).json({ error: 'Maximum verification attempts exceeded. Please request a new OTP.' });
    }

    // 5. Compare Hash
    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(testOtp.otp_hash, 'hex')
    );

    const newAttempts = testOtp.attempt_count + 1;

    if (isMatch) {
      // Correct OTP: mark as used
      const { error: updateErr } = await supabaseAdmin
        .from('website_store_msg91_test_otps')
        .update({
          used_at: now.toISOString(),
          attempt_count: newAttempts
        })
        .eq('id', testOtp.id);

      if (updateErr) {
        console.error('[test-msg91-verify] Update success failed:', updateErr);
        return res.status(500).json({ error: 'Failed to update test OTP state on success.' });
      }

      console.log('[test-msg91] OTP verification accepted');
      return res.status(200).json({
        success: true,
        verified: true,
        provider: 'msg91',
        architecture: 'flow',
        verificationMode: 'local-server-hash'
      });
    } else {
      // Incorrect OTP: increment attempt count
      const { error: updateErr } = await supabaseAdmin
        .from('website_store_msg91_test_otps')
        .update({
          attempt_count: newAttempts
        })
        .eq('id', testOtp.id);

      if (updateErr) {
        console.error('[test-msg91-verify] Update attempt failed:', updateErr);
      }

      if (newAttempts >= 3) {
        return res.status(400).json({
          error: 'Maximum verification attempts exceeded. Please request a new OTP.',
          attemptsRemaining: 0
        });
      }

      return res.status(400).json({
        error: 'Invalid verification code.',
        attemptsRemaining: 3 - newAttempts
      });
    }

  } catch (err) {
    console.error('[test-msg91-verify] Unexpected failure:', err);
    return res.status(500).json({ error: 'Internal server error verifying OTP.' });
  }
}
