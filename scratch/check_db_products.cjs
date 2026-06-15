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
    console.log('Querying website_pooja_products...');
    const { data, error } = await supabase
      .from('website_pooja_products')
      .select('id, name, is_published, slug, price');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    console.log(`Successfully fetched ${data.length} products:`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
