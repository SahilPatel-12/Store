const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']);

async function run() {
  try {
    const { data: orders, error } = await supabase
      .from('website_store_orders')
      .select('*');

    if (error) throw error;
    const allProducts = [];
    orders.forEach(order => {
      let itemsList = [];
      try {
        itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        itemsList = order.items || [];
      }
      itemsList.forEach(item => {
        if (item.product) {
          allProducts.push(item.product);
        } else {
          allProducts.push(item);
        }
      });
    });
    fs.writeFileSync(path.join(__dirname, 'ordered_items.json'), JSON.stringify(allProducts, null, 2));
    console.log(`Saved ${allProducts.length} items to scratch/ordered_items.json`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
