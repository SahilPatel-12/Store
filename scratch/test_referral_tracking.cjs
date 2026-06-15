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
    // 1. Fetch an active affiliate code
    console.log('Fetching active affiliate...');
    const { data: users, error: userError } = await supabase
      .from('website_store_users')
      .select('id, full_name, affiliate_code, affiliate_status')
      .eq('affiliate_status', 'active')
      .limit(1);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      console.warn('No active affiliate user found to test with. Make sure at least one user is registered as active.');
      return;
    }

    const affiliate = users[0];
    const code = affiliate.affiliate_code;
    console.log(`Using affiliate: ${affiliate.full_name} with code: ${code}`);

    // 2. Test validate_referral_code
    console.log(`Testing validate_referral_code with code: ${code}...`);
    const { data: valResult, error: valError } = await supabase.rpc('validate_referral_code', {
      p_code: code
    });

    if (valError) {
      console.error('validate_referral_code RPC Error:', valError.message);
    } else {
      console.log('validate_referral_code Result:', valResult);
    }

    // 3. Test log_referral_click
    console.log(`Testing log_referral_click...`);
    const { data: clickResult, error: clickError } = await supabase.rpc('log_referral_click', {
      p_referral_code: code,
      p_landing_page: '/shop?ref=' + code,
      p_device_id: 'node_test_device',
      p_ip: '127.0.0.1',
      p_user_agent: 'NodeTestAgent'
    });

    if (clickError) {
      console.error('log_referral_click RPC Error:', clickError.message);
    } else {
      console.log('log_referral_click Result:', clickResult);
    }

    // 4. Test binding on signup (using a dummy referred UUID or creating one)
    // We can query for a non-referred devotee or just generate a new random UUID
    const dummyReferredId = '00000000-0000-0000-0000-000000000000'; // won't bind to actual row but verifies RPC executes without crash
    console.log(`Testing bind_referral_on_signup with dummy ID...`);
    const { data: bindResult, error: bindError } = await supabase.rpc('bind_referral_on_signup', {
      p_referred_id: dummyReferredId,
      p_referrer_code: code
    });

    if (bindError) {
      console.error('bind_referral_on_signup RPC Error:', bindError.message);
    } else {
      console.log('bind_referral_on_signup Result:', bindResult);
    }

  } catch (err) {
    console.error('Error during execution:', err);
  }
}

run();
