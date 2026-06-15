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
    console.log('Attempting authentication via password...');
    // We don't know the password hash for 'sahilInstitute@gmail.com', but let's see if we get the ambiguous column error or credentials error.
    const { data, error } = await supabase.rpc('authenticate_user_password', {
      p_email_or_phone: 'sahilInstitute@gmail.com',
      p_password_hash: 'dummy_hash',
      p_device_id: 'node_test_client',
      p_ip: '127.0.0.1',
      p_user_agent: 'NodeTest'
    });

    if (error) {
      console.error('Password Login RPC Error:', error);
    } else {
      console.log('Password Login RPC Result:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
