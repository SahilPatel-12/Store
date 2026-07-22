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
  const userId = 'ea6fa1bb-3969-430f-95cd-ae076130064c';
  
  console.log('Deleting product orders for user in public.orders...');
  const { data: deletedOrders, error: delErr } = await supabase
    .from('orders')
    .delete()
    .eq('user_id', userId)
    .eq('order_type', 'product')
    .select();

  if (delErr) {
    console.error('Delete Error:', delErr);
  } else {
    console.log('Successfully deleted product orders:', deletedOrders?.length, deletedOrders);
  }

  // Fetch remaining orders to verify
  const { data: remainingOrders, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId);

  console.log('Remaining orders count for user:', remainingOrders?.length);
}

test();
