import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { decryptTextWithCustomKey } from '../_lib/crypto-server.js';
import { verifyAdmin } from '../_lib/admin/auth.js';
import crypto from 'crypto';

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ error: 'Missing phone number.' });
  }

  try {
    // 1. Verify Admin Session
    const adminSession = await verifyAdmin(req);
    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session.' });
    }

    // 2. Validate and Normalize Phone Number
    const ipAddress = getClientIp(req);
    
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
      return res.status(400).json({ error: 'Invalid Indian phone number format. Must be a 10-digit mobile number, optionally prefixed with 0, 91, or +91.' });
    }

    // 3. Database-backed Rate Limiting
    const nowIso = new Date().toISOString();
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // 3a. Cooldown on same phone
    const { data: recentPhone } = await supabaseAdmin
      .from('website_store_otp_logs')
      .select('id')
      .eq('phone_number', formattedPhone)
      .gt('requested_at', oneMinAgo)
      .limit(1);

    if (recentPhone && recentPhone.length > 0) {
      return res.status(429).json({ error: 'Please wait at least 60 seconds before requesting another OTP.' });
    }

    // 3b. Cooldown on same IP
    const { data: recentIp } = await supabaseAdmin
      .from('website_store_otp_logs')
      .select('id')
      .eq('ip_address', ipAddress)
      .gt('requested_at', oneMinAgo)
      .limit(1);

    if (recentIp && recentIp.length > 0) {
      return res.status(429).json({ error: 'Too many requests from this IP. Please wait 60 seconds.' });
    }

    // 3c. Hourly caps
    const { data: hourlyPhone } = await supabaseAdmin
      .from('website_store_otp_logs')
      .select('id')
      .eq('phone_number', formattedPhone)
      .gt('requested_at', oneHourAgo);

    if (hourlyPhone && hourlyPhone.length >= 99) {
      return res.status(429).json({ error: 'You have reached the hourly limit of OTP requests for this phone number.' });
    }

    // 4. Fetch and decrypt MSG91 settings
    const { data: msg91Data } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'msg91_settings')
      .maybeSingle();

    if (!msg91Data?.value) {
      return res.status(400).json({ error: 'MSG91 settings are not configured in the database.' });
    }

    const val = msg91Data.value;
    if (!val.encrypted_auth_key || !val.encrypted_template_id) {
      return res.status(400).json({ error: 'MSG91 configuration is incomplete (missing Auth Key or Flow ID).' });
    }

    const rawKey = process.env.ENCRYPTION_STRING_KEY_ESG_91 || 'gk4ukWKg78THpQ170x0XY0aPl9';
    let decryptedAuthKey, decryptedTemplateId;
    try {
      decryptedAuthKey = decryptTextWithCustomKey(val.encrypted_auth_key, val.auth_key_iv, val.auth_key_tag, rawKey);
      decryptedTemplateId = decryptTextWithCustomKey(val.encrypted_template_id, val.template_id_iv, val.template_id_tag, rawKey);
    } catch (decErr) {
      console.error('[test-msg91-send] Decryption failed:', decErr);
      return res.status(500).json({ error: 'Internal failure decrypting MSG91 configurations.' });
    }

    // 5. Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

    // 6. Store hash in temporary test table
    // Delete any active test OTP for this phone and admin to prevent duplicate entries
    await supabaseAdmin
      .from('website_store_msg91_test_otps')
      .delete()
      .eq('admin_id', adminSession.id)
      .eq('phone_number', formattedPhone);

    const { error: insertErr } = await supabaseAdmin
      .from('website_store_msg91_test_otps')
      .insert({
        admin_id: adminSession.id,
        phone_number: formattedPhone,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempt_count: 0
      });

    if (insertErr) {
      console.error('[test-msg91-send] DB Insert failed:', insertErr);
      return res.status(500).json({ error: 'Database failed to store temporary test OTP state.' });
    }

    // 7. Invoke MSG91 Flow API (Send SMS)
    console.log('[test-msg91] MSG91 SMS template test requested.');
    console.log('Preparing MSG91 SMS template request.');
    console.log('Request contract: template_id + recipients[] + mobiles + VAR1.');
    
    let response;
    try {
      response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': decryptedAuthKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          template_id: decryptedTemplateId,
          recipients: [
            {
              mobiles: formattedPhone,
              VAR1: otp,
              var1: otp,
              otp: otp
            }
          ]
        })
      });
    } catch (fetchErr) {
      console.error('[test-msg91-send] Fetch error:', fetchErr);
      
      // Clean up local DB state on dispatch failure
      await supabaseAdmin
        .from('website_store_msg91_test_otps')
        .delete()
        .eq('admin_id', adminSession.id)
        .eq('phone_number', formattedPhone);

      return res.status(502).json({ error: 'Failed to contact MSG91 gateway.' });
    }

    const responseStatus = response.status;
    const responseBody = await response.text();
    console.log(`[test-msg91] MSG91 request completed. Status: ${responseStatus}`);

    let parsedResponse;
    let isSuccess = false;
    try {
      parsedResponse = JSON.parse(responseBody);
      // MSG91 success is typically indicated by type === "success" or request_status === "success"
      if (responseStatus === 200 && (parsedResponse.type === 'success' || parsedResponse.request_status === 'success' || parsedResponse.has_error === false)) {
        isSuccess = true;
      }
    } catch (parseErr) {
      // Fallback check if response isn't JSON
      if (responseStatus === 200 && responseBody.toLowerCase().includes('success')) {
        isSuccess = true;
      }
    }

    if (!isSuccess) {
      console.error('[test-msg91-send] Gateway rejected request:', responseStatus, responseBody);
      
      // Invalidate the test OTP state since delivery failed
      await supabaseAdmin
        .from('website_store_msg91_test_otps')
        .delete()
        .eq('admin_id', adminSession.id)
        .eq('phone_number', formattedPhone);

      return res.status(400).json({
        error: 'MSG91 gateway rejected the request.',
        provider: 'msg91',
        product: 'flow-api',
        requestAccepted: false,
        providerType: parsedResponse?.type || 'error'
      });
    }

    console.log('[test-msg91] MSG91 gateway request accepted.');

    // 8. Log rate-limiting success log
    try {
      await supabaseAdmin.from('website_store_otp_logs').insert({
        phone_number: formattedPhone,
        ip_address: ipAddress,
        requested_at: new Date().toISOString()
      });
    } catch (logErr) {
      console.error('[test-msg91-send] Logging rate-limit entry failed:', logErr.message);
    }

    let txnIdMasked = '******';
    if (parsedResponse && parsedResponse.message) {
      const msg = String(parsedResponse.message);
      if (msg.length > 4) {
        txnIdMasked = `******${msg.slice(-4)}`;
      }
    }

    return res.status(200).json({
      success: true,
      provider: 'msg91',
      product: 'flow-api',
      requestAccepted: true,
      providerType: 'success',
      transactionIdMasked: txnIdMasked
    });

  } catch (err) {
    console.error('[test-msg91-send] Unexpected failure:', err);
    return res.status(500).json({ error: 'Internal server error processing send request.' });
  }
}
