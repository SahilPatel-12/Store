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
    console.log('Fetching website_pooja_products where slug is vidya-rudraksh...');
    const { data, error } = await supabase
      .from('website_pooja_products')
      .select('*')
      .eq('slug', 'vidya-rudraksh');

    if (error) throw error;
    console.log('Products:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
