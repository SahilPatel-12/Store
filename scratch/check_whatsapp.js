import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import crypto from 'crypto';

// Load env variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8');
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

function decryptTextNode(cipherTextBase64, secretKey) {
  try {
    const keyData = Buffer.alloc(16, ' ');
    keyData.write(secretKey.slice(0, 16));
    const combined = Buffer.from(cipherTextBase64, 'base64');
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    // AES-GCM decryption in Node.js requires auth tag at the end. AES-GCM standard in WebCrypto appends it.
    // Let's print out raw parameters first.
    return {
      ivHex: iv.toString('hex'),
      encryptedDataLength: encryptedData.length,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function run() {
  console.log('Using encryption key:', encryptionKey);
  const { data, error } = await supabase
    .from('website_settings')
    .select('*')
    .eq('key', 'whatsapp_settings')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('WhatsApp Settings stored data:', JSON.stringify(data, null, 2));
    const decryptedInfo = decryptTextNode(data.value.token, encryptionKey);
    console.log('Decrypted metadata:', decryptedInfo);
  }
}

run();
