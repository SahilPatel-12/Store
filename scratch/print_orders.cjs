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
    .select('order_id, phone_number, status, payment_method, payment_status, total, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching orders:', error);
  } else {
    console.log('Orders found:', JSON.stringify(orders, null, 2));
  }
}

main();
