import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load env variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8');
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
  // Query 1 row from website_store_users to inspect fields
  const { data, error } = await supabase
    .from('website_store_users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching website_store_users:', error);
  } else {
    console.log('User sample columns:', Object.keys(data[0] || {}));
    console.log('Sample data:', data[0]);
  }
}

run();
