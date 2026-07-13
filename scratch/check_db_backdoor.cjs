const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
    const testPhone = '7999279610'; // navneet pandit ji
    console.log(`Calling authenticate_user_otp for phone: ${testPhone}...`);
    
    const { data, error } = await supabase.rpc('authenticate_user_otp', {
      p_phone: testPhone,
      p_otp_entered: '260529',
      p_otp_generated: '123456',
      p_device_id: 'test_script',
      p_ip: '127.0.0.1',
      p_user_agent: 'test'
    });

    if (error) {
      console.error('RPC Error:', error);
    } else {
      console.log('RPC Success:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
