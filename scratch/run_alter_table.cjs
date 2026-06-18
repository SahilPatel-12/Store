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
    const query = `
      ALTER TABLE website_store_orders 
      ADD COLUMN IF NOT EXISTS payment_screenshot TEXT;
    `;
    
    console.log('Running ALTER TABLE query...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: query
    });

    if (error) {
      console.error('SQL Execution Error:', error);
      return;
    }

    console.log('SQL Executed successfully. Response data:', data);
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
