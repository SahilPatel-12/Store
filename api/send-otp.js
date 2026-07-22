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

    // Run rate-limiting queries in parallel to minimize latency
    const [recentPhoneRes, recentIpRes, hourlyPhoneRes, hourlyIpRes] = await Promise.all([
      supabaseAdmin
        .from('website_store_otp_logs')
        .select('id')
        .eq('phone_number', formattedPhone)
        .gt('requested_at', oneMinAgo)
        .limit(1),
      supabaseAdmin
        .from('website_store_otp_logs')
        .select('id')
        .eq('ip_address', ipAddress)
        .gt('requested_at', oneMinAgo)
        .limit(1),
      supabaseAdmin
        .from('website_store_otp_logs')
        .select('id')
        .eq('phone_number', formattedPhone)
        .gt('requested_at', oneHourAgo),
      supabaseAdmin
        .from('website_store_otp_logs')
        .select('id')
        .eq('ip_address', ipAddress)
        .gt('requested_at', oneHourAgo)
    ]);

    if (recentPhoneRes.data && recentPhoneRes.data.length > 0) {
      return res.status(429).json({ error: 'Please wait at least 60 seconds before requesting another OTP.' });
    }

    if (recentIpRes.data && recentIpRes.data.length > 0) {
      return res.status(429).json({ error: 'Too many requests from this IP. Please wait 60 seconds.' });
    }

    if (hourlyPhoneRes.data && hourlyPhoneRes.data.length >= 99) {
      return res.status(429).json({ error: 'You have reached the hourly limit of OTP requests for this phone number.' });
    }

    if (hourlyIpRes.data && hourlyIpRes.data.length >= 99) {
      return res.status(429).json({ error: 'Too many OTP requests from your connection. Please try again in an hour.' });
    }

  } catch (dbErr) {
    // Graceful fallback if website_store_otp_logs migration hasn't been run yet
    console.warn('[send-otp] Rate-limiting logs check skipped. Ensure website_store_otp_logs table is created:', dbErr.message);
  }

  try {
    // ==========================================
    // 1. WhatsApp Settings Config (Primary & Exclusive Gateway)
    // ==========================================
    const { data: waData } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'whatsapp_settings')
      .maybeSingle();

    if (!waData?.value) {
      return res.status(400).json({ error: 'No OTP gateway configurations (WhatsApp) found.' });
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

    // Sanitized log: No plaintext OTP or full numbers
    console.log('[send-otp] WhatsApp OTP request received');

    let gatewayStatus = 200;
    let gatewayResponseText = '';

    try {
      if (val.endpoint.includes('bhashsms.com')) {
        const urlObj = new URL(val.endpoint);
        urlObj.searchParams.set('pass', decryptedToken);
        
        // Strip 91 prefix for BhashSMS (expects 10 digit number) to prevent routing delay
        let bhashPhone = formattedPhone;
        if (bhashPhone.startsWith('91') && bhashPhone.length === 12) {
          bhashPhone = bhashPhone.substring(2);
        }
        urlObj.searchParams.set('phone', bhashPhone);
        
        // Dynamically set Params based on template name
        const textParam = urlObj.searchParams.get('text') || '';
        if (textParam === 'service_rejected_hindi') {
          urlObj.searchParams.set('Params', `${otp},Low CIBIL Score`);
        } else {
          urlObj.searchParams.set('Params', otp);
        }

        console.log('[send-otp] Firing BhashSMS gateway request');
        
        const resGateway = await fetch(urlObj.toString());
        gatewayStatus = resGateway.status;
        gatewayResponseText = await resGateway.text();
      } else {
        console.log('[send-otp] Firing POST gateway request');
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

      if (gatewayStatus === 200) {
        console.log('[send-otp] WhatsApp gateway request completed successfully');
      } else {
        console.warn(`[send-otp] WhatsApp gateway rejected request. Status: ${gatewayStatus}`);
      }
    } catch (fetchErr) {
      console.warn('[send-otp] WhatsApp gateway request failed:', fetchErr.message);
      
      const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
      if (isDev) {
        console.log('\n========================================');
        console.log(`[DEV MODE OTP BYPASS]`);
        console.log(`Phone: ${phone}`);
        console.log(`Generated OTP: ${otp}`);
        console.log('========================================\n');
        
        gatewayStatus = 200;
        gatewayResponseText = 'mock_dev_success';
      } else {
        throw fetchErr;
      }
    }
    
    // Log request asynchronously in background to speed up HTTP response time
    logOtpRequest(formattedPhone, ipAddress).catch(err => {
      console.warn('[send-otp] Background log update failed:', err.message);
    });

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
