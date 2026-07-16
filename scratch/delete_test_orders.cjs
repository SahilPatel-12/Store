const { createClient } = require('@supabase/supabase-js');
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
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceRoleKey);

const targetOrderIds = [
  'MANTRA-473410',
  'MANTRA-690344',
  'MANTRA-691701',
  'MANTRA-887212',
  'MANTRA-242195'
];

async function run() {
  try {
    console.log('Querying existing orders...');
    const { data: existing, error: queryError } = await supabase
      .from('website_store_orders')
      .select('order_id, full_name, total, status, created_at')
      .in('order_id', targetOrderIds);

    if (queryError) throw queryError;

    console.log('Found orders to delete:', existing);

    if (existing.length === 0) {
      console.log('No matching orders found in the database. Please check the order IDs.');
      return;
    }

    const foundIds = existing.map(o => o.order_id);
    console.log(`Deleting ${foundIds.length} orders...`);
    const { data: deleted, error: deleteError } = await supabase
      .from('website_store_orders')
      .delete()
      .in('order_id', foundIds)
      .select('order_id');

    if (deleteError) throw deleteError;

    console.log('Deleted orders successfully:', deleted);
  } catch (err) {
    console.error('Error executing delete operation:', err);
  }
}

run();
