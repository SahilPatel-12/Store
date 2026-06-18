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
    const invalidPayload = {
      order_id: 'MANTRA-TEST-ERR',
      nonexistent_column_abc: 'value'
    };
    
    console.log('Inserting with invalid column...');
    const { data, error } = await supabase.from('website_store_orders').insert(invalidPayload);

    if (error) {
      console.log('Error object structure:');
      console.log('Code:', error.code);
      console.log('Message:', error.message);
      console.log('Details:', error.details);
      console.log('Hint:', error.hint);
      return;
    }
    console.log('Insert unexpectedly succeeded:', data);
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
