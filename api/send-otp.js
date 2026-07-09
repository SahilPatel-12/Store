import { supabaseAdmin } from './_lib/supabase-admin.js';
import { decryptTextServer, decryptTextWithCustomKey } from './_lib/crypto-server.js';
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

  const { phone, otp } = req.body || {};
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Missing phone number or OTP code.' });
  }

  const ipAddress = getClientIp(req);
  const cleanPhone = phone.replace(/[^\d]/g, '');
  let formattedPhone = cleanPhone;
  if (formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }

  // ==========================================
  // Anti-Spam Security: Database-backed Rate Limiting
  // ==========================================
  try {
    const nowIso = new Date().toISOString();
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // 1. Strict 60s cooldown limit on same phone
    const { data: recentPhone } = await supabaseAdmin
      .from('website_store_otp_logs')
      .select('id')
      .eq('phone_number', formattedPhone)
      .gt('requested_at', oneMinAgo)
      .limit(1);

    if (recentPhone && recentPhone.length > 0) {
      return res.status(429).json({ error: 'Please wait at least 60 seconds before requesting another OTP.' });
    }

    // 2. Strict 60s cooldown limit on same IP
    const { data: recentIp } = await supabaseAdmin
      .from('website_store_otp_logs')
      .select('id')
      .eq('ip_address', ipAddress)
      .gt('requested_at', oneMinAgo)
      .limit(1);

    if (recentIp && recentIp.length > 0) {
      return res.status(429).json({ error: 'Too many requests from this IP. Please wait 60 seconds.' });
    }

    // 3. Hourly limit: max 99 requests per phone number (increased for testing)
    const { data: hourlyPhone } = await supabaseAdmin
      .from('website_store_otp_logs')
      .select('id')
      .eq('phone_number', formattedPhone)
      .gt('requested_at', oneHourAgo);

    if (hourlyPhone && hourlyPhone.length >= 99) {
      return res.status(429).json({ error: 'You have reached the hourly limit of OTP requests for this phone number.' });
    }

    // 4. Hourly limit: max 99 requests per IP address (increased for testing)
    const { data: hourlyIp } = await supabaseAdmin
      .from('website_store_otp_logs')
      .select('id')
      .eq('ip_address', ipAddress)
      .gt('requested_at', oneHourAgo);

    if (hourlyIp && hourlyIp.length >= 99) {
      return res.status(429).json({ error: 'Too many OTP requests from your connection. Please try again in an hour.' });
    }

  } catch (dbErr) {
    // Graceful fallback if website_store_otp_logs migration hasn't been run yet
    console.warn('[send-otp] Rate-limiting logs check skipped. Ensure website_store_otp_logs table is created:', dbErr.message);
  }

  try {
    // ==========================================
    // Fetch and check MSG91 Settings First
    // ==========================================
    const { data: msg91Data } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'msg91_settings')
      .maybeSingle();

    if (msg91Data?.value) {
      const val = msg91Data.value;
      if (val.encrypted_auth_key && val.encrypted_template_id) {
        const rawKey = process.env.ENCRYPTION_STRING_KEY_ESG_91 || 'gk4ukWKg78THpQ170x0XY0aPl9';
        
        let decryptedAuthKey, decryptedTemplateId;
        try {
          decryptedAuthKey = decryptTextWithCustomKey(val.encrypted_auth_key, val.auth_key_iv, val.auth_key_tag, rawKey);
          decryptedTemplateId = decryptTextWithCustomKey(val.encrypted_template_id, val.template_id_iv, val.template_id_tag, rawKey);
        } catch (decErr) {
          console.error('[send-otp] Secure MSG91 decryption failed:', decErr);
          return res.status(500).json({ error: 'Failed to decrypt MSG91 credentials on server.' });
        }

        const msg91SenderId = val.sender_id || '';

        // Fire MSG91 Flow API request
        const requestPayload = {
          flow_id: decryptedTemplateId,
          sender: msg91SenderId,
          mobiles: formattedPhone,
          var1: otp, // Maps to ##var1##
          otp: otp   // Maps to ##otp##
        };

        // Output code in console log for secure local-only testing
        console.log(`\n======================================================`);
        console.log(`[send-otp] LOCAL TEST MSG91 OTP FOR ${formattedPhone}: ${otp}`);
        console.log(`======================================================\n`);

        console.log(`[send-otp] Dispatching OTP via MSG91 Flow API to phone: ${formattedPhone}, sender: ${msg91SenderId}`);
        const resGateway = await fetch('https://control.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'authkey': decryptedAuthKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });

        const gatewayStatus = resGateway.status;
        const gatewayResponseText = await resGateway.text();
        console.log(`[send-otp] MSG91 gateway responded with status: ${gatewayStatus}, body: ${gatewayResponseText}`);

        if (gatewayStatus === 200) {
          // Log request in rate limiting logs
          await logOtpRequest(formattedPhone, ipAddress);
          return res.status(200).json({
            success: true,
            gatewayStatus,
            message: 'OTP dispatched securely via MSG91.',
            detail: gatewayResponseText
          });
        } else {
          return res.status(gatewayStatus).json({
            error: 'MSG91 OTP dispatch failed.',
            detail: gatewayResponseText
          });
        }
      }
    }

    // ==========================================
    // Fallback: WhatsApp Settings Config
    // ==========================================
    const { data: waData } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'whatsapp_settings')
      .maybeSingle();

    if (!waData?.value) {
      return res.status(400).json({ error: 'No OTP gateway configurations (MSG91 or WhatsApp) found.' });
    }

    const val = waData.value;
    if (!val.endpoint || (!val.encrypted_token && !val.token)) {
      return res.status(400).json({ error: 'WhatsApp gateway configurations are incomplete.' });
    }

    const encryptionKey = process.env.ENCRYPTION_STRING_KEY || 'sg6XisTlL2QcXSuE';
    let decryptedToken;
    if (val.version === 'v2' || val.encrypted_token) {
      try {
        decryptedToken = decryptTextServer(val.encrypted_token, val.iv, val.auth_tag);
      } catch (decErr) {
        console.error('[send-otp] Secure GCM decryption failed:', decErr);
        return res.status(500).json({ error: 'Failed to decrypt secure WhatsApp gateway credentials on server.' });
      }
    } else {
      // Legacy GCM decryption using AES-128-GCM
      try {
        const keyData = Buffer.alloc(16);
        const keyBuf = Buffer.from(encryptionKey);
        keyBuf.copy(keyData, 0, 0, Math.min(keyBuf.length, 16));

        const combined = Buffer.from(val.token, 'base64');
        const iv = combined.subarray(0, 12);
        const encrypted = combined.subarray(12);

        const decipher = crypto.createDecipheriv('aes-128-gcm', keyData, iv);
        const authTag = encrypted.subarray(encrypted.length - 16);
        const cipher = encrypted.subarray(0, encrypted.length - 16);

        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(cipher, 'binary', 'utf8');
        decrypted += decipher.final('utf8');
        decryptedToken = decrypted;
      } catch (decErr) {
        console.error('[send-otp] Legacy decryption failed:', decErr);
        return res.status(500).json({ error: 'Failed to decrypt legacy WhatsApp gateway credentials on server.' });
      }
    }

    // Output code in console log for secure local-only testing
    console.log(`\n======================================================`);
    console.log(`[send-otp] LOCAL TEST WHATSAPP OTP FOR ${formattedPhone}: ${otp}`);
    console.log(`======================================================\n`);

    let gatewayStatus = 200;
    let gatewayResponseText = '';

    if (val.endpoint.includes('bhashsms.com')) {
      const urlObj = new URL(val.endpoint);
      urlObj.searchParams.set('pass', decryptedToken);
      urlObj.searchParams.set('phone', formattedPhone);
      urlObj.searchParams.set('Params', `${otp},Low CIBIL Score`);

      console.log(`[send-otp] Firing BhashSMS request to: ${urlObj.toString().replace(decryptedToken, '********')}`);
      
      const resGateway = await fetch(urlObj.toString());
      gatewayStatus = resGateway.status;
      gatewayResponseText = await resGateway.text();
    } else {
      console.log(`[send-otp] Firing POST gateway request to: ${val.endpoint}`);
      const resGateway = await fetch(val.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decryptedToken}`
        },
        body: JSON.stringify({
          to: phone,
          recipient: phone,
          phone: phone,
          message: `Your Mantra Puja authentication OTP is: ${otp}. Valid for 5 minutes.`,
          body: `Your Mantra Puja authentication OTP is: ${otp}. Valid for 5 minutes.`
        })
      });
      gatewayStatus = resGateway.status;
      gatewayResponseText = await resGateway.text();
    }

    console.log(`[send-otp] Gateway responded with status: ${gatewayStatus}, body: ${gatewayResponseText}`);
    
    // Log request in rate limiting logs
    await logOtpRequest(formattedPhone, ipAddress);

    return res.status(200).json({
      success: true,
      gatewayStatus,
      message: 'OTP request processed via WhatsApp gateway.',
      detail: gatewayResponseText
    });

  } catch (err) {
    console.error('[send-otp] Internal handler exception:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}

// Log successful request helper
async function logOtpRequest(phone, ip) {
  try {
    await supabaseAdmin
      .from('website_store_otp_logs')
      .insert({
        phone_number: phone,
        ip_address: ip
      });

    // Prune entries older than 24 hours
    supabaseAdmin
      .from('website_store_otp_logs')
      .delete()
      .lt('requested_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .then(({ error }) => {
        if (error) console.error('[send-otp] Pruning rate limit logs failed:', error);
      });
  } catch (err) {
    console.warn('[send-otp] Could not log rate limit entry in database:', err.message);
  }
}
