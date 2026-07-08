import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load env variables manually
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  console.log('Fetching columns and data types for admin_sessions...');
  let cols1 = null, err1 = null;
  try {
    const res = await supabase.rpc('get_table_columns_type', { t_name: 'admin_sessions' });
    cols1 = res.data;
    err1 = res.error;
  } catch (e) {}
  
  // Or query via information_schema
  // Since we might not have RPC, let's run a raw REST API call to check Swagger schema definition
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  const schema = await res.json();
  console.log('admin_sessions definition columns:');
  const properties = schema?.definitions?.admin_sessions?.properties;
  if (properties) {
    for (const key of Object.keys(properties)) {
      console.log(` - ${key}: ${properties[key].type} (Format: ${properties[key].format || 'none'})`);
    }
  } else {
    console.log('Could not load swagger definitions directly, let us check via REST API query...');
  }
}

run();
