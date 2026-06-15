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
    const { data: users, error } = await supabase
      .from('website_store_users')
      .select('id, full_name, email, phone_number, affiliate_status, affiliate_code, referred_by')
      .ilike('email', 'sahil%');

    if (error) throw error;
    console.log('Sahil Users:', JSON.stringify(users, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
