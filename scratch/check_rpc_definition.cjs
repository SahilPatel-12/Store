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
    // Run an RPC that retrieves metadata or query a table to find the columns of get_referral_tree_by_session
    // Since we don't have direct SQL execution, we can query pg_catalog if postgrest allows it, but postgrest doesn't expose catalog tables by default.
    // Let's try calling it and printing all keys of the first element.
    const phone = '7974478098'; // Sahil Patel
    const { data: authData } = await supabase.rpc('authenticate_user_otp', {
      p_phone: phone,
      p_otp_entered: '260529',
      p_otp_generated: '123456',
      p_device_id: 'node_test_client',
      p_ip: '127.0.0.1',
      p_user_agent: 'NodeTest'
    });

    const token = authData[0].session_token;
    const { data: treeData } = await supabase.rpc('get_referral_tree_by_session', {
      p_session_token: token,
      p_max_depth: 5
    });

    console.log('All keys in first element of treeData:', Object.keys(treeData[0]));
    console.log('First element details:', treeData[0]);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
