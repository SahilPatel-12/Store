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
  const { data, error } = await supabase
    .from('website_store_users')
    .select('id, full_name, phone_number, created_at')
    .limit(10);

  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Sample website_store_users entries:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
