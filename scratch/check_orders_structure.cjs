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
    const { data: order, error } = await supabase
      .from('website_store_orders')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    console.log('Order structure keys:', Object.keys(order));
    console.log('Sample order:', JSON.stringify(order, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
