import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function tryDecryption(encryptedText, ivHex, authTagHex) {
  const keysToTry = [
    env['PAYMENT_CONFIG_ENCRYPTION_KEY'],
    env['ENCRYPTION_STRING_KEY'],
    'sg6XisTlL2QcXSuE',
    'dev_fallback_payment_encryption_key_must_be_rotated_prod'
  ];

  const encTypes = ['hex', 'base64'];

  for (const rawKey of keysToTry) {
    if (!rawKey) continue;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest();
    for (const type of encTypes) {
      try {
        const encryptedBuf = Buffer.from(encryptedText, type);
        const decipher = crypto.createDecipheriv('aes-256-gcm', keyHash, Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        let decrypted = decipher.update(encryptedBuf);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return { success: true, decrypted: decrypted.toString('utf8'), keyUsed: rawKey, typeUsed: type };
      } catch (e) {
        // try next
      }
    }
  }
  return { success: false };
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

    const val = data.value;
    const result = tryDecryption(val.encrypted_token, val.iv, val.auth_tag);
    if (!result.success) {
      console.error('Decryption failed!');
      return;
    }

    const decryptedToken = result.decrypted;
    const testPhone = '7974478098'; // Sahil Patel's number

    // List of templates to test with the active password
    const testTemplates = [
      {
        name: 'Configured Endpoint in DB',
        url: val.endpoint
      },
      {
        name: 'demo_utility (BUZWAP)',
        url: 'https://bhashsms.com/api/sendmsg.php?user=MisCRM&sender=BUZWAP&text=demo_utility&priority=wa&stype=normal'
      },
      {
        name: 'whoapplied (MisCRM)',
        url: 'https://bhashsms.com/api/sendmsg.php?user=MisCRM&sender=MisCRM&text=whoapplied&priority=wa&stype=normal'
      },
      {
        name: 'service_rejected_hindi (MisCRM)',
        url: 'https://bhashsms.com/api/sendmsg.php?user=MisCRM&sender=MisCRM&text=service_rejected_hindi&priority=wa&stype=normal'
      },
      {
        name: 'Welcome_to_Miss_CRM (MISSCRM)',
        url: 'https://bhashsms.com/api/sendmsg.php?user=MisCRM&sender=MISSCRM&text=Welcome_to_Miss_CRM&priority=wa&stype=normal'
      }
    ];

    console.log('--- Testing WhatsApp Templates with decrypted token ---');
    for (const t of testTemplates) {
      try {
        const urlObj = new URL(t.url);
        urlObj.searchParams.set('pass', decryptedToken);
        urlObj.searchParams.set('phone', testPhone);

        const textParam = urlObj.searchParams.get('text') || '';
        if (textParam === 'service_rejected_hindi' || textParam === 'whoapplied') {
          urlObj.searchParams.set('Params', `123456,Low CIBIL Score`);
        } else {
          urlObj.searchParams.set('Params', '123456');
        }

        const res = await fetch(urlObj.toString());
        const responseText = await res.text();
        console.log(`[Test] ${t.name}: status=${res.status}, body=${responseText.trim()}`);
      } catch (err) {
        console.error(`[Test] ${t.name} failed:`, err.message);
      }
    }

  } catch (err) {
    console.error('Script Error:', err);
  }
}

run();
