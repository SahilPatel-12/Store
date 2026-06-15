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
    console.log('Altering public.website_store_users columns to be nullable...');
    const query = `
      ALTER TABLE public.website_store_users ALTER COLUMN full_name DROP NOT NULL;
      ALTER TABLE public.website_store_users ALTER COLUMN email DROP NOT NULL;
      ALTER TABLE public.website_store_users ALTER COLUMN password_hash DROP NOT NULL;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: query
    });

    if (error) {
      console.error('SQL Execution Error:', error);
      return;
    }

    console.log('Table altered successfully!', data);
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
