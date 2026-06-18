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
    const { data, error } = await supabase
      .from('website_store_orders')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Fetch Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Columns of website_store_orders:');
      console.log(Object.keys(data[0]));
      console.log('Sample row:', data[0]);
    } else {
      console.log('No data found in website_store_orders');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
