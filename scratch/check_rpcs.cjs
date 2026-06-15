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
    console.log('Testing admin_get_all_affiliate_levels RPC...');
    const { data, error } = await supabase.rpc('admin_get_all_affiliate_levels', {
      p_admin_token: 'dummy_token'
    });
    
    if (error) {
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
    } else {
      console.log('Success! Data:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
