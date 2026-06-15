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
    const rand = Math.floor(Math.random() * 1000000);
    const email = `testuser_${rand}@devotion.com`;
    const phone = `900${String(rand).padStart(7, '0')}`;
    
    console.log(`Testing database insert with: email=${email}, phone=${phone}...`);
    const { data, error } = await supabase
      .from('website_store_users')
      .insert({
        full_name: 'Test Devotee',
        email: email,
        phone_number: phone,
        password_hash: 'dummy_hash',
        last_login_at: new Date().toISOString()
      })
      .select('*');

    if (error) {
      console.error('Insert Error Detail:', JSON.stringify(error, null, 2));
    } else {
      console.log('Insert Success:', data);
    }
  } catch (err) {
    console.error('Execution Error:', err);
  }
}

run();
