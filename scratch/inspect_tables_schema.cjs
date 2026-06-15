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
    console.log('Querying table information...');
    
    // We can run an RPC or query system tables if permissions allow, or check common tables
    const tables = [
      'website_pooja_products',
      'website_settings',
      'website_store_admin',
      'website_store_users',
      'website_store_orders',
      'website_store_addresses',
      'website_store_coupons',
      'website_store_coupon_redemptions'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`Table ${table}: error fetching: ${error.message}`);
      } else {
        console.log(`Table ${table}: count = ${count}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
