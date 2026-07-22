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
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const res1 = await supabase.from('website_store_otps').select('*').limit(1);
    console.log('website_store_otps availability:', res1.error ? `Error: ${res1.error.message}` : 'Exist (Success)');
  } catch (e) {
    console.log('website_store_otps check threw:', e.message);
  }

  try {
    const res2 = await supabase.from('website_store_msg91_test_otps').select('*').limit(1);
    console.log('website_store_msg91_test_otps availability:', res2.error ? `Error: ${res2.error.message}` : 'Exist (Success)');
  } catch (e) {
    console.log('website_store_msg91_test_otps check threw:', e.message);
  }
}

run();
