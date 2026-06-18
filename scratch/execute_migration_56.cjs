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
    const migrationPath = path.join(__dirname, '../src/migrations/56_add_payment_decline_count_to_orders.sql');
    console.log(`Reading migration SQL file at ${migrationPath}...`);
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration on Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });

    if (error) {
      console.error('SQL Execution Error:', error);
      process.exit(1);
    }

    console.log('Migration successfully completed! Response:', data);
    process.exit(0);
  } catch (err) {
    console.error('Exception during execution:', err);
    process.exit(1);
  }
}

run();
