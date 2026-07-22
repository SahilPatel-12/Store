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
  console.log('--- RECENT website_store_orders ---');
  const { data: webOrders, error: webErr } = await supabase
    .from('website_store_orders')
    .select('order_id, status, payment_status, payment_method, full_name, phone_number, total, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (webErr) console.error(webErr);
  else console.log(webOrders);

  console.log('--- RECENT public.orders (Mobile Sync Table) ---');
  const { data: mobileOrders, error: mobErr } = await supabase
    .from('orders')
    .select('id, user_id, order_type, total_amount, order_status, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (mobErr) console.error(mobErr);
  else console.log(mobileOrders);
}

main();
