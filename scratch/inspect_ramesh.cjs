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
    const ids = [
      '32110317-3072-4d8b-9bc2-125598750237', // Sahil Patel (User 1)
      '096c5fa7-1373-433f-ada3-c331e63bc256', // Devotee Ramesh (User 2)
      '31720205-e04f-49b4-afc3-bf3f9a6c3f72'  // Devotee Amit (User 3)
    ];

    const { data: users, error } = await supabase
      .from('website_store_users')
      .select('id, full_name, email, phone_number, affiliate_status, affiliate_code, referred_by')
      .in('id', ids);

    if (error) throw error;
    console.log('User Details:', JSON.stringify(users, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
