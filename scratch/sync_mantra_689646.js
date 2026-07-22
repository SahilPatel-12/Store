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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseServiceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  const userId = 'ea6fa1bb-3969-430f-95cd-ae076130064c'; // mobile user ID
  
  console.log('Manually syncing MANTRA-689646 order to public schema...');

  // Since order was created earlier in test (id: 658e8cd2-dbac-4c09-b740-84e514f669e3), let's use it or create a new one.
  // Let's delete the old one first to avoid duplicates
  await supabase.from('orders').delete().eq('user_id', userId).eq('order_type', 'product');

  // 1. Insert order
  const { data: newOrder, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_type: 'product',
      total_amount: 1,
      payment_status: 'failed',
      order_status: 'Cancelled',
      subtotal: 1,
      discount: 0,
      tax: 0,
      shipping_cost: 0,
      created_at: '2026-07-21T19:51:15.640948+00:00'
    })
    .select()
    .single();

  if (orderErr) {
    console.error('Order Sync Error:', orderErr);
    return;
  }
  console.log('Manually created order row:', newOrder.id);

  // 2. Insert shipping address (no country column)
  const { error: addressErr } = await supabase
    .from('shipping_addresses')
    .insert({
      order_id: newOrder.id,
      full_name: 'sahil_test',
      phone: '+918819897434',
      address_line_1: 'cdcscf',
      address_line_2: 'MANTRA-689646', // Mapped website order ID
      city: 'Ujjain',
      state: 'Madhya Pradesh',
      pincode: '456010'
    });

  if (addressErr) {
    console.error('Address Sync Error:', addressErr);
  } else {
    console.log('Successfully synced shipping address.');
  }

  // 3. Insert order item (no item_name column)
  const { error: itemErr } = await supabase
    .from('order_items')
    .insert({
      order_id: newOrder.id,
      item_type: 'product',
      item_id: 'vidya-rudraksh', // product slug
      quantity: 1,
      price: 1
    });

  if (itemErr) {
    console.error('Item Sync Error:', itemErr);
  } else {
    console.log('Successfully synced order item.');
  }
}

test();
