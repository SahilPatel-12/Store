import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Load .env.local variables manually
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
} catch (err) {
  console.warn('Could not read .env.local manually:', err.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function decryptTextWithCustomKey(ciphertext, ivHex, authTagHex, key) {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyHash, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function testConnection() {
  console.log('--- MSG91 Connection & Balance Test Script ---');
  console.log('1. Fetching settings from Supabase...');
  
  const { data: msg91Data, error } = await supabase
    .from('website_settings')
    .select('value')
    .eq('key', 'msg91_settings')
    .maybeSingle();

  if (error) {
    console.error('Supabase fetch error:', error);
    process.exit(1);
  }

  if (!msg91Data?.value) {
    console.error('No MSG91 settings found in the website_settings table!');
    process.exit(1);
  }

  const val = msg91Data.value;
  console.log('✔ Settings retrieved from DB successfully.');
  
  const rawKey = process.env.ENCRYPTION_STRING_KEY_ESG_91 || 'gk4ukWKg78THpQ170x0XY0aPl9';

  let authKey, flowId, senderId;
  try {
    authKey = decryptTextWithCustomKey(val.encrypted_auth_key, val.auth_key_iv, val.auth_key_tag, rawKey);
    flowId = decryptTextWithCustomKey(val.encrypted_template_id, val.template_id_iv, val.template_id_tag, rawKey);
    senderId = val.sender_id || 'CREDSM';
    
    console.log('✔ Credentials decrypted successfully!');
    console.log(`- Decrypted Auth Key: ${authKey.substring(0, 4)}...${authKey.slice(-4)}`);
    console.log(`- Decrypted Flow ID: ${flowId}`);
    console.log(`- Sender ID: ${senderId}`);
  } catch (decErr) {
    console.error('✘ Decryption failed! Check ENCRYPTION_STRING_KEY_ESG_91.');
    process.exit(1);
  }

  console.log('\n2. Fetching Account details and SMS balance from MSG91...');
  try {
    const balanceRes = await fetch('https://api.msg91.com/api/v1/account', {
      method: 'GET',
      headers: {
        'authkey': authKey
      }
    });

    const balanceStatus = balanceRes.status;
    const balanceText = await balanceRes.text();

    if (balanceStatus === 200) {
      try {
        const balanceData = JSON.parse(balanceText);
        console.log('✔ MSG91 Account details retrieved successfully!');
        console.log(`- Account Name: ${balanceData.name || 'N/A'}`);
        console.log(`- Cash Credits (SMS Balance): ${balanceData.cash_credits ?? '0'}`);
        console.log(`- Email Credits: ${balanceData.email_credits ?? '0'}`);
      } catch (parseErr) {
        console.warn('✔ MSG91 returned HTTP 200, but content is not JSON:');
        console.log(balanceText.substring(0, 500));
      }
    } else {
      console.error(`✘ Failed to retrieve account details (HTTP ${balanceStatus})`);
      console.error(balanceText.substring(0, 500));
    }
  } catch (balErr) {
    console.error('Error fetching MSG91 balance:', balErr.message);
  }

  const testMobile = '917974478098';
  const testOtp = '123456';

  console.log(`\n3. Sending test request to MSG91 Flow API for mobile: ${testMobile}...`);
  const requestPayload = {
    flow_id: flowId,
    sender: senderId,
    mobiles: testMobile,
    var1: testOtp,
    otp: testOtp
  };

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    const status = res.status;
    const bodyText = await res.text();

    console.log(`\n--- MSG91 Response (HTTP ${status}) ---`);
    console.log(bodyText);
    console.log('--------------------------------------');
  } catch (apiErr) {
    console.error('✘ Request failed:', apiErr);
  }
}

testConnection();
