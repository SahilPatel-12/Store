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
    const parentId = '3b4a182e-b94b-4efe-923c-6d5d4c66cf60'; // affilation
    const { data: users, error } = await supabase
      .from('website_store_users')
      .select('*')
      .eq('referred_by', parentId);

    if (error) throw error;
    console.log('Users referred by affilation (User 2):', users);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
