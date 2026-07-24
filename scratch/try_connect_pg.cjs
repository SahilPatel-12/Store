const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env variables
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

const host = 'db.vjkwmefdutltwccpgnny.supabase.co';
const user = 'postgres';
const passwords = [
  env['ENCRYPTION_STRING_KEY'],
  env['STORE_INSIDE_CRIDENTIALS'],
  env['PAYMENT_CONFIG_ENCRYPTION_KEY'],
  env['ENCRYPTION_STRING_KEY_ESG_91'],
  'sg6XisTlL2QcXSuE',
  'JbebFU6aqaYnRVMX',
  'H72vRKJNNAFKVwmM3wcPCXP4g34kNTFx'
].filter(Boolean);

// Unique passwords list
const uniquePasswords = [...new Set(passwords)];

async function tryConnect() {
  console.log(`Testing connection to ${host} with ${uniquePasswords.length} passwords...`);
  for (const password of uniquePasswords) {
    console.log(`Trying password: ${password.substring(0, 3)}...`);
    const client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user,
      password,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`\nSUCCESS! Connected successfully with password: ${password}`);
      const res = await client.query("SELECT version();");
      console.log(`Database Version: ${res.rows[0].version}`);
      await client.end();
      return;
    } catch (err) {
      console.log(`Failed: ${err.message}`);
    }
  }
  console.log('All passwords failed.');
}

tryConnect();
