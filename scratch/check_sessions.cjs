const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Fetching users...');
    const { data: users, error: usersErr } = await supabase
      .from('website_store_users')
      .select('id, email, phone_number, affiliate_status')
      .limit(5);
    
    if (usersErr) throw usersErr;
    console.log('Users:', users);

    console.log('Fetching user sessions...');
    const { data: sessions, error: sessionsErr } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(5);
    
    if (sessionsErr) {
      console.warn('Could not query user_sessions directly (probably RLS):', sessionsErr.message);
    } else {
      console.log('User Sessions:', sessions);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
