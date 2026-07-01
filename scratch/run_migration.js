import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const filename = process.argv[2];
  if (!filename) {
    console.error('Please specify migration filename');
    process.exit(1);
  }
  try {
    const migrationPath = path.join(__dirname, '../src/migrations/', filename);
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
