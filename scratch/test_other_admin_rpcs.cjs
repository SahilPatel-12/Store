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

async function testRpc(name, params) {
  console.log(`\n--- Testing ${name} ---`);
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    console.log('Result: Error');
    console.log('Code:', error.code);
    console.log('Message:', error.message);
  } else {
    console.log('Result: Success');
  }
}

async function run() {
  await testRpc('admin_set_affiliate_status', {
    p_admin_token: 'dummy',
    p_target_user_id: '00000000-0000-0000-0000-000000000000',
    p_new_status: 'approved'
  });

  await testRpc('admin_get_all_affiliate_levels', {
    p_admin_token: 'dummy'
  });

  await testRpc('admin_get_all_affiliate_settings', {
    p_admin_token: 'dummy'
  });

  await testRpc('admin_get_all_withdrawals', {
    p_admin_token: 'dummy'
  });

  await testRpc('admin_save_affiliate_settings', {
    p_admin_token: 'dummy',
    p_max_depth: 5,
    p_enabled: true,
    p_commission_model: 'percentage',
    p_min_withdrawal: 100.00
  });

  await testRpc('admin_save_affiliate_level', {
    p_admin_token: 'dummy',
    p_level_number: 1,
    p_commission_percentage: 10.0,
    p_enabled: true
  });

  await testRpc('admin_delete_affiliate_level', {
    p_admin_token: 'dummy',
    p_level_number: 1
  });
}

run();
