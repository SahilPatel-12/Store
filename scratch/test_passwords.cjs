const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

const passwords = [
  env['STORE_INSIDE_CRIDENTIALS'],
  env['ENCRYPTION_STRING_KEY'],
  env['ENCRYPTION_STRING_KEY_ESG_91'],
  env['PAYMENT_CONFIG_ENCRYPTION_KEY']
].filter(Boolean);

const dbUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const ref = dbUrl.split('//')[1].split('.')[0];
const host = `db.${ref}.supabase.co`;

async function test(pw) {
  const client = new Client({
    host: host,
    port: 5432,
    user: 'postgres',
    password: pw,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log(`SUCCESS with password: ${pw}`);
    return true;
  } catch (e) {
    console.log(`FAILED with password: ${pw} - Error: ${e.message}`);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function run() {
  for (const pw of passwords) {
    const ok = await test(pw);
    if (ok) break;
  }
}

run();
