import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  // Let's run a query to get RLS status of website_store_orders
  const { data: rlsStatus, error } = await supabase
    .rpc('get_api_configs') // Wait, we can't use exec_sql, but we can execute a simple query on a view or use public function
    .limit(1);

  // Let's select from pg_tables via public view if possible, or wait!
  // Can we query pg_catalog tables using postgres service role client?
  // Let's check if we can fetch policies directly
  const { data: policies, error: polErr } = await supabase
    .from('website_store_orders')
    .select('id')
    .limit(1);
    
  console.log('direct query ok');
}

test();
