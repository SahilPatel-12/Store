const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']);

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
    console.log('1. Calling get_affiliate_profile...');
    const { data: profile, error: profErr } = await supabase.rpc('get_affiliate_profile', {
      p_session_token: token
    });
    if (profErr) console.error('  Failed:', profErr.message);
    else console.log('  Success:', profile);

    // Call get_referral_tree_by_session
    console.log('2. Calling get_referral_tree_by_session...');
    const { data: tree, error: treeErr } = await supabase.rpc('get_referral_tree_by_session', {
      p_session_token: token,
      p_max_depth: 5
    });
    if (treeErr) console.error('  Failed:', treeErr.message);
    else console.log('  Success:', tree);

    // Call get_commissions_history_by_session
    console.log('3. Calling get_commissions_history_by_session...');
    const { data: comms, error: commsErr } = await supabase.rpc('get_commissions_history_by_session', {
      p_session_token: token
    });
    if (commsErr) console.error('  Failed:', commsErr.message);
    else console.log('  Success:', comms);

    // Call get_withdrawal_history_by_session
    console.log('4. Calling get_withdrawal_history_by_session...');
    const { data: withdrawals, error: wErr } = await supabase.rpc('get_withdrawal_history_by_session', {
      p_session_token: token
    });
    if (wErr) console.error('  Failed:', wErr.message);
    else console.log('  Success:', withdrawals);

  } catch (err) {
    console.error('Exception:', err.message);
  }
}

run();
