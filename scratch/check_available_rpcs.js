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

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const schema = await res.json();
    console.log('Paths available in schema cache:');
    const paths = Object.keys(schema.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log(rpcs.join('\n'));
  } catch (err) {
    console.error('Failed to fetch schema:', err);
  }
}

run();
