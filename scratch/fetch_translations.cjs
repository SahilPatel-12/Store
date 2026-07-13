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
    console.log('Fetching translation row for product_id: 9b2524ca-7eb8-43c0-9465-e38d00326eb6...');
    const { data, error } = await supabase
      .from('website_pooja_product_translations')
      .select('*')
      .eq('product_id', '9b2524ca-7eb8-43c0-9465-e38d00326eb6');

    if (error) throw error;
    console.log('Translations count:', data.length);
    console.log('Translations details:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
