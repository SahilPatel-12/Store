const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

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
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SupabaseUrl or Service Key missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin(username, password) {
  try {
    console.log('Hashing password securely...');
    const passwordHash = await hashPassword(password.trim());

    console.log('Clearing existing admin users...');
    const { error: delErr } = await supabase
      .from('website_store_admin')
      .delete()
      .neq('username', '');
    if (delErr) throw delErr;

    console.log('Inserting new administrative credentials...');
    const { error: insErr } = await supabase
      .from('website_store_admin')
      .insert({
        username: username.trim().toLowerCase(),
        password_hash: passwordHash
      });
    if (insErr) throw insErr;

    console.log('Invalidating old admin sessions...');
    await supabase.from('admin_sessions').delete().neq('session_token_hash', '');

    console.log('\n=== Setup completed successfully! ===');
    console.log('Admin account created/updated for username:', username.trim());
  } catch (err) {
    console.error('\nSetup failed:', err);
    process.exit(1);
  }
}

async function run() {
  const argUser = process.argv[2];
  const argPass = process.argv[3];

  if (argUser && argPass) {
    console.log('Running setup non-interactively using CLI arguments...');
    await seedAdmin(argUser, argPass);
    process.exit(0);
  }

  console.log('=== Secure Administrator Setup/Seed Tool ===\n');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    const username = await question('Enter desired Admin Username: ');
    if (!username.trim()) {
      console.error('Username cannot be empty.');
      process.exit(1);
    }

    const password = await question('Enter desired Admin Password: ');
    if (password.length < 16) {
      console.error('Password must be at least 16 characters long.');
      process.exit(1);
    }

    await seedAdmin(username, password);
  } finally {
    rl.close();
  }
}

run();
