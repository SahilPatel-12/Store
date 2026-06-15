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
    const phone = '7979488819'; // Devotee Ramesh
    console.log('Authenticating Devotee Ramesh...');
    const { data: authData, error: authErr } = await supabase.rpc('authenticate_user_otp', {
      p_phone: phone,
      p_otp_entered: '260529',
      p_otp_generated: '123456',
      p_device_id: 'node_test_client',
      p_ip: '127.0.0.1',
      p_user_agent: 'NodeTest'
    });

    if (authErr) throw authErr;
    const token = authData[0].session_token;
    console.log('Logged in successfully! Token:', token);

    // Call get_affiliate_profile
    console.log('Calling get_affiliate_profile...');
    const p1 = await supabase.rpc('get_affiliate_profile', { p_session_token: token });
    if (p1.error) console.error('get_affiliate_profile Error:', p1.error.message);
    else console.log('get_affiliate_profile Success:', p1.data);

    // Call get_referral_tree_by_session
    console.log('Calling get_referral_tree_by_session...');
    const p2 = await supabase.rpc('get_referral_tree_by_session', { p_session_token: token, p_max_depth: 5 });
    if (p2.error) console.error('get_referral_tree_by_session Error:', p2.error.message);
    else console.log('get_referral_tree_by_session Success:', p2.data);

    // Call get_commissions_history_by_session
    console.log('Calling get_commissions_history_by_session...');
    const p3 = await supabase.rpc('get_commissions_history_by_session', { p_session_token: token });
    if (p3.error) console.error('get_commissions_history_by_session Error:', p3.error.message);
    else console.log('get_commissions_history_by_session Success:', p3.data);

    // Call get_withdrawal_history_by_session
    console.log('Calling get_withdrawal_history_by_session...');
    const p4 = await supabase.rpc('get_withdrawal_history_by_session', { p_session_token: token });
    if (p4.error) console.error('get_withdrawal_history_by_session Error:', p4.error.message);
    else console.log('get_withdrawal_history_by_session Success:', p4.data);

  } catch (err) {
    console.error('Catch error:', err.message);
  }
}

run();
