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
    const token = '6b3726dc56c85e66786361ea3fada91a66cca08bf8e413bfac05bfe074a7d2a2';
    
    console.log('Validating session token directly via SELECT on user_sessions...');
    // Since we don't have RLS read on user_sessions for anon, let's check who the current user is
    // by using supabase.auth or fetching the user profile with that token.
    const { data: profile, error } = await supabase.rpc('get_affiliate_profile', {
      p_session_token: token
    });

    if (error) throw error;
    console.log('Profile associated with token:', profile);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
