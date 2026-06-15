const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load env variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const encryptionKey = env['ENCRYPTION_STRING_KEY'] || 'sg6XisTlL2QcXSuE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom decryption helper using Node crypto (equivalent to web subtle crypto AES-GCM)
function decryptNode(cipherTextBase64, secretKey) {
  const keyData = Buffer.alloc(16);
  const keyBuf = Buffer.from(secretKey);
  keyBuf.copy(keyData, 0, 0, Math.min(keyBuf.length, 16));

  const combined = Buffer.from(cipherTextBase64, 'base64');
  const iv = combined.subarray(0, 12);
  const encrypted = combined.subarray(12);

  // AES-128-GCM uses 16 byte key
  const decipher = crypto.createDecipheriv('aes-128-gcm', keyData, iv);
  // In AES-GCM, the auth tag is appended or handled. Subtle crypto appends the 16-byte auth tag at the end of the ciphertext.
  const authTag = encrypted.subarray(encrypted.length - 16);
  const cipher = encrypted.subarray(0, encrypted.length - 16);

  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(cipher, 'binary', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function run() {
  try {
    console.log('Fetching whatsapp_settings...');
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .eq('key', 'whatsapp_settings')
      .single();

    if (error) throw error;
    console.log('Encrypted settings:', data.value);

    console.log('Decrypting token...');
    const decryptedToken = decryptNode(data.value.token, encryptionKey);
    console.log('Decrypted token successfully (length):', decryptedToken.length);

    const testPhone = '8819897434'; // Sahil Patel
    const testOtp = '123456';

    const urlObj = new URL(data.value.endpoint);
    urlObj.searchParams.set('pass', decryptedToken);
    urlObj.searchParams.set('phone', testPhone);
    urlObj.searchParams.set('Params', `${testOtp},Low CIBIL Score`);

    console.log('Calling BhashSMS gateway:', urlObj.toString().replace(decryptedToken, '******'));
    
    const res = await fetch(urlObj.toString());
    const text = await res.text();
    console.log('Gateway response status:', res.status);
    console.log('Gateway response body:', text);

  } catch (err) {
    console.error('Error in test:', err);
  }
}

run();
