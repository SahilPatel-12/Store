const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data: orders, error } = await supabase
    .from('website_store_orders')
    .select('order_id, items');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  for (const o of orders) {
    try {
      if (typeof o.items === 'string') {
        JSON.parse(o.items);
      }
    } catch (err) {
      console.log(`Order ${o.order_id} has invalid items JSON:`, o.items, err.message);
    }
  }
  console.log('Finished checking items JSON of all orders.');
}

main();
