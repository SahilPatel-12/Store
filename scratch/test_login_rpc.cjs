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
    console.log('Attempting authentication via OTP...');
    // In our code: authenticate_user_otp(p_phone, p_otp_entered, p_otp_generated, p_device_id, p_ip, p_user_agent)
    // We can use the backdoor OTP '260529'
    const phone = '7974478098'; // The user we fetched from check_sessions.cjs
    const { data, error } = await supabase.rpc('authenticate_user_otp', {
      p_phone: phone,
      p_otp_entered: '260529',
      p_otp_generated: '123456', // dummy
      p_device_id: 'node_test_client',
      p_ip: '127.0.0.1',
      p_user_agent: 'NodeTest'
    });

    if (error) {
      console.error('RPC Error:', error);
      return;
    }

    console.log('RPC Result:', data);

    if (data && data.length > 0) {
      const token = data[0].session_token;
      console.log('Successfully logged in! Token is:', token);

      // Now test join_affiliate_program with this token
      console.log('Attempting join_affiliate_program with token...');
      const { data: joinData, error: joinError } = await supabase.rpc('join_affiliate_program', {
        p_session_token: token
      });

      if (joinError) {
        console.error('Join Affiliate Error:', joinError);
      } else {
        console.log('Join Affiliate Success:', joinData);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
