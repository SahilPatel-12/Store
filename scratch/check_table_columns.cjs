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
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'website_store_orders'
      ORDER BY ordinal_position;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: query
    });

    if (error) {
      console.error('SQL Execution Error:', error);
      return;
    }

    console.log('Columns of website_store_orders:');
    console.table(data);
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
