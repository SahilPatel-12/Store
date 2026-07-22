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
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const migrationPath = path.join(__dirname, '../src/migrations/88_secure_otp_verification.sql');
    console.log('Reading migration file:', migrationPath);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration 88 via exec_sql RPC...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });

    if (error) {
      console.error('Migration 88 Failed:', error);
      process.exit(1);
    }

    console.log('Migration 88 Applied Successfully!');
    console.log('Result:', data);
  } catch (err) {
    console.error('Exception during migration:', err);
    process.exit(1);
  }
}

run();
