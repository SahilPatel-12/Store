const { Client } = require('pg');
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

const password = env['STORE_INSIDE_CRIDENTIALS'];
const dbUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const ref = dbUrl.split('//')[1].split('.')[0];
const host = `db.${ref}.supabase.co`;

const client = new Client({
  host: host,
  port: 5432,
  user: 'postgres',
  password: password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log(`Connecting directly to database ${host} on port 5432...`);
    await client.connect();
    console.log('Connected successfully!');

    const migrationPath = path.join(__dirname, '../src/migrations/88_secure_otp_verification.sql');
    console.log('Reading migration file:', migrationPath);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Executing SQL migration script...');
    await client.query(sql);
    console.log('Migration successfully applied directly to database!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
