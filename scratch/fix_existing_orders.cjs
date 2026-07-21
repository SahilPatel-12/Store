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
  const targetOrderIds = ['MANTRA-513849', 'MANTRA-943676', 'MANTRA-809141', 'MANTRA-621004'];

  console.log('Updating orders in website_store_orders...');
  const { data: updatedWebOrders, error: webError } = await supabase
    .from('website_store_orders')
    .update({
      payment_method: 'COD',
      status: 'Being Packed',
      payment_status: 'Pending'
    })
    .in('order_id', targetOrderIds)
    .select('order_id, payment_method, status, payment_status');

  if (webError) {
    console.error('Error updating website_store_orders:', webError);
  } else {
    console.log('Updated website_store_orders:', updatedWebOrders);
  }

  // Now check if they exist in public.orders (mobile sync)
  console.log('Checking and updating synced public.orders...');
  for (const oid of targetOrderIds) {
    // Look up the order in website_store_orders to get total/created_at to match in public.orders if needed,
    // or we can match public.orders by total_amount and user_id.
    // Wait, let's see if public.orders has matching records.
    const { data: matchingOrders, error: matchErr } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status, order_status')
      .eq('order_type', 'product');

    // Let's print them to see if we can find them
    if (matchErr) {
      console.error('Error fetching public.orders:', matchErr);
    }
  }
}

main();
