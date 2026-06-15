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
    const phone = '7974478098'; // Sahil Patel
    console.log('Authenticating with phone:', phone);
    const { data: authData, error: authError } = await supabase.rpc('authenticate_user_otp', {
      p_phone: phone,
      p_otp_entered: '260529',
      p_otp_generated: '123456',
      p_device_id: 'node_test_client',
      p_ip: '127.0.0.1',
      p_user_agent: 'NodeTest'
    });

    if (authError) {
      console.error('Authentication failed:', authError);
      return;
    }

    console.log('Authentication success:', authData);
    if (!authData || authData.length === 0) {
      console.log('No auth data returned');
      return;
    }

    const token = authData[0].session_token;
    console.log('Session token:', token);

    console.log('Calling get_referral_tree_by_session...');
    const { data: treeData, error: treeError } = await supabase.rpc('get_referral_tree_by_session', {
      p_session_token: token,
      p_max_depth: 5
    });

    if (treeError) {
      console.error('get_referral_tree_by_session failed:', treeError);
    } else {
      console.log('get_referral_tree_by_session success. Columns/Keys in first element:', treeData && treeData.length > 0 ? Object.keys(treeData[0]) : 'empty tree');
      console.log('Tree data:', treeData);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
