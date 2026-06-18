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
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const encryptionKey = env['ENCRYPTION_STRING_KEY'] || 'sg6XisTlL2QcXSuE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function decryptNode(cipherTextBase64, secretKey) {
  const keyData = Buffer.alloc(16);
  const keyBuf = Buffer.from(secretKey);
  keyBuf.copy(keyData, 0, 0, Math.min(keyBuf.length, 16));
  const combined = Buffer.from(cipherTextBase64, 'base64');
  const iv = combined.subarray(0, 12);
  const encrypted = combined.subarray(12);
  const decipher = crypto.createDecipheriv('aes-128-gcm', keyData, iv);
  const authTag = encrypted.subarray(encrypted.length - 16);
  const cipher = encrypted.subarray(0, encrypted.length - 16);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(cipher, 'binary', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function run() {
  try {
    const { data } = await supabase
      .from('website_settings')
      .select('*')
      .eq('key', 'whatsapp_settings')
      .single();

    const decryptedToken = decryptNode(data.value.token, encryptionKey);
    const testOtp = '888888';

    // Format 1: 12-digits (919009046430)
    const url1 = new URL(data.value.endpoint);
    url1.searchParams.set('pass', decryptedToken);
    url1.searchParams.set('phone', '919009046430');
    url1.searchParams.set('Params', `${testOtp},Low CIBIL Score`);

    console.log('Testing with 919009046430 (12 digits)...');
    const res1 = await fetch(url1.toString());
    const body1 = await res1.text();
    console.log('Response status:', res1.status);
    console.log('Response body:', body1);

    // Format 2: 10-digits (9009046430)
    const url2 = new URL(data.value.endpoint);
    url2.searchParams.set('pass', decryptedToken);
    url2.searchParams.set('phone', '9009046430');
    url2.searchParams.set('Params', `${testOtp},Low CIBIL Score`);

    console.log('\nTesting with 9009046430 (10 digits)...');
    const res2 = await fetch(url2.toString());
    const body2 = await res2.text();
    console.log('Response status:', res2.status);
    console.log('Response body:', body2);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
