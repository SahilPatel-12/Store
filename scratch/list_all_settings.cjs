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
    console.log('Fetching all entries in website_settings...');
    const { data, error } = await supabase
      .from('website_settings')
      .select('key, value');

    if (error) throw error;
    console.log('All settings keys found:');
    data.forEach(row => {
      console.log(`- ${row.key}:`, typeof row.value === 'object' ? Object.keys(row.value) : row.value);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
