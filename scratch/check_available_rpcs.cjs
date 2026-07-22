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
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    console.log('HTTP Status:', res.status);
    const schema = await res.json();
    console.log('Schema keys:', Object.keys(schema));
    if (schema.paths) {
      const paths = Object.keys(schema.paths || {});
      const rpcs = paths.filter(p => p.startsWith('/rpc/'));
      console.log('RPC paths in schema:', rpcs);
    } else {
      console.log('No paths found. Response content:', schema);
    }
  } catch (err) {
    console.error('Failed to fetch schema:', err);
  }
}

run();
