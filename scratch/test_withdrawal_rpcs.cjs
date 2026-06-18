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
  console.log(`\n--- Testing ${name} with params:`, Object.keys(params), '---');
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    console.log('Result: Error');
    console.log('Code:', error.code);
    console.log('Message:', error.message);
  } else {
    console.log('Result: Success');
    console.log('Data:', data);
  }
}

async function run() {
  const dummyUuid = '00000000-0000-0000-0000-000000000000';
  
  // Test admin_approve_withdrawal
  await testRpc('admin_approve_withdrawal', {
    p_admin_token: 'dummy',
    p_request_id: dummyUuid
  });
  await testRpc('admin_approve_withdrawal', {
    p_session_token: 'dummy',
    p_request_id: dummyUuid
  });

  // Test admin_reject_withdrawal
  await testRpc('admin_reject_withdrawal', {
    p_admin_token: 'dummy',
    p_request_id: dummyUuid,
    p_reason: 'dummy'
  });
  await testRpc('admin_reject_withdrawal', {
    p_session_token: 'dummy',
    p_request_id: dummyUuid,
    p_reason: 'dummy'
  });

  // Test admin_mark_withdrawal_paid
  await testRpc('admin_mark_withdrawal_paid', {
    p_admin_token: 'dummy',
    p_request_id: dummyUuid,
    p_txn_id: 'dummy'
  });
  await testRpc('admin_mark_withdrawal_paid', {
    p_session_token: 'dummy',
    p_request_id: dummyUuid,
    p_txn_id: 'dummy'
  });
}

run();
