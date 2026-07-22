const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Read env.local from the store project directory
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function decryptTextServer(encryptedText, ivHex, authTagHex) {
  const key = process.env.ENCRYPTION_STRING_KEY || env['ENCRYPTION_STRING_KEY'] || 'sg6XisTlL2QcXSuE';
  
  // Pad or truncate key to 16 bytes (AES-128)
  const keyData = Buffer.alloc(16);
  const keyBuf = Buffer.from(key);
  keyBuf.copy(keyData, 0, 0, Math.min(keyBuf.length, 16));

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedText, 'base64');

  const decipher = crypto.createDecipheriv('aes-128-gcm', keyData, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'binary', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function run() {
  try {
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .eq('key', 'whatsapp_settings')
      .single();

    if (error) {
      console.error('Error fetching whatsapp_settings:', error.message);
      return;
    }

    console.log('--- WhatsApp Settings Config ---');
    console.log('Key:', data.key);
    
    // Mask sensitive fields in console output
    const maskedVal = { ...data.value };
    if (maskedVal.token) maskedVal.token = '***MASKED***';
    if (maskedVal.encrypted_token) maskedVal.encrypted_token = '***MASKED***';
    console.log('Value:', JSON.stringify(maskedVal, null, 2));

    const val = data.value;
    let decryptedToken = '';
    const encryptionKey = env['ENCRYPTION_STRING_KEY'] || 'sg6XisTlL2QcXSuE';
    
    if (val.version === 'v2' || val.encrypted_token) {
      try {
        decryptedToken = decryptTextServer(val.encrypted_token, val.iv, val.auth_tag);
        console.log('Decrypted Token (v2): Successful!');
      } catch (err) {
        console.error('Decryption failed (v2):', err.message);
      }
    } else {
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
        console.log('Decrypted Token (Legacy): Successful!');
      } catch (err) {
        console.error('Decryption failed (Legacy):', err.message);
      }
    }

    // Call the endpoint to see if it works
    if (val.endpoint.includes('bhashsms.com')) {
      const urlObj = new URL(val.endpoint);
      urlObj.searchParams.set('pass', decryptedToken);
      urlObj.searchParams.set('phone', '7974478098');
      
      // Dynamically set Params based on template name
      const textParam = urlObj.searchParams.get('text') || '';
      if (textParam === 'service_rejected_hindi') {
        urlObj.searchParams.set('Params', `123456,Low CIBIL Score`);
      } else {
        urlObj.searchParams.set('Params', '123456');
      }

      console.log('Calling URL (without token visible):', val.endpoint.split('?')[0]);
      
      const res = await fetch(urlObj.toString());
      console.log('Response status:', res.status);
      const txt = await res.text();
      console.log('Response text:', txt);
    } else {
      console.log('Sending POST to endpoint:', val.endpoint);
      const res = await fetch(val.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decryptedToken}`
        },
        body: JSON.stringify({
          to: '7974478098',
          recipient: '7974478098',
          phone: '7974478098',
          message: 'Your OTP is: 123456',
          body: 'Your OTP is: 123456'
        })
      });
      console.log('Response status:', res.status);
      const txt = await res.text();
      console.log('Response text:', txt);
    }
  } catch (err) {
    console.error('Script Error:', err);
  }
}

run();
