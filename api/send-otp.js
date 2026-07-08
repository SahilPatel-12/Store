import { supabaseAdmin } from './_lib/supabase-admin.js';
import crypto from 'crypto';

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

  try {
    const encryptionKey = process.env.ENCRYPTION_STRING_KEY || 'sg6XisTlL2QcXSuE';

    // 1. Fetch settings from database
    const { data, error } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'whatsapp_settings')
      .single();

    if (error) {
      console.error('[send-otp] Supabase fetch error:', error);
      return res.status(500).json({ error: 'WhatsApp configurations could not be loaded: ' + error.message });
    }

    if (!data?.value) {
      return res.status(400).json({ error: 'WhatsApp gateway is not configured yet.' });
    }

    const val = data.value;
    if (!val.endpoint || !val.token) {
      return res.status(400).json({ error: 'WhatsApp gateway configurations are incomplete.' });
    }

    // 2. Decrypt token using Node's native crypto (AES-128-GCM)
    let decryptedToken;
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
      console.error('[send-otp] Decryption failed:', decErr);
      return res.status(500).json({ error: 'Failed to decrypt WhatsApp gateway credentials on server.' });
    }

    // 3. Dispatch HTTP request to gateway
    let gatewayStatus = 200;
    let gatewayResponseText = '';

    if (val.endpoint.includes('bhashsms.com')) {
      const urlObj = new URL(val.endpoint);
      urlObj.searchParams.set('pass', decryptedToken);
      
      // Standardize phone format for BhashSMS (10 digits with optional 91 prefix)
      let cleanPhone = phone.replace(/[^\d]/g, '');
      if (cleanPhone.length > 10 && (cleanPhone.startsWith('91') || cleanPhone.startsWith('0'))) {
        cleanPhone = cleanPhone.slice(-10);
      }
      if (urlObj.searchParams.get('priority') === 'wa' && cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }
      urlObj.searchParams.set('phone', cleanPhone);
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
    return res.status(200).json({
      success: true,
      gatewayStatus,
      message: 'OTP request processed.',
      detail: gatewayResponseText
    });

  } catch (err) {
    console.error('[send-otp] Internal handler exception:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
