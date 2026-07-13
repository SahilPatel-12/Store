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
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  try {
    console.log('Querying table information from postgres system catalogs...');
    const { data, error } = await supabase.rpc('get_table_info', {});
    // If the RPC get_table_info does not exist, let's query the catalog directly using postgrest or a simple query.
    if (error) {
      console.log('get_table_info RPC failed or missing, trying catalog query...');
      // Let's run a raw query by creating a temporary function or just querying our target tables
      const tables = ['website_store_products', 'website_pooja_products', 'pooja_products', 'products'];
      for (const t of tables) {
        const { data: cols, error: err } = await supabase.from(t).select('*').limit(1);
        if (err) {
          console.log(`Table ${t} query failed:`, err.message);
        } else {
          console.log(`Table ${t} exists and contains`, cols.length, 'rows.');
        }
      }
    } else {
      console.log('Tables:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
