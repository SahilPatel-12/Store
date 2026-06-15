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
    // 1. Fetch Sahil Patel (User 1)
    const phone = '7974478098'; // Sahil Patel
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

    // 2. Fetch entire referral tree for Sahil Patel
    const { data: tree, error: treeErr } = await supabase.rpc('get_referral_tree_by_session', {
      p_session_token: token,
      p_max_depth: 5
    });
    if (treeErr) throw treeErr;
    console.log('--- Sahil Patel Referral Tree ---');
    console.log(JSON.stringify(tree, null, 2));

    // 3. Fetch all active users and their referred_by column
    const { data: users, error: userErr } = await supabase
      .from('website_store_users')
      .select('id, full_name, email, phone_number, affiliate_status, affiliate_code, referred_by');
    if (userErr) throw userErr;
    console.log('\n--- All Users ---');
    console.log(JSON.stringify(users, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
