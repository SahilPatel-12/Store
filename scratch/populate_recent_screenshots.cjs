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
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateOrderScreenshot(orderId, url) {
  console.log(`Updating order #${orderId} with screenshot URL: ${url}`);
  const { data, error } = await supabase
    .from('website_store_orders')
    .update({ payment_screenshot: url })
    .eq('order_id', orderId)
    .select();

  if (error) {
    console.error(`Error updating order #${orderId}:`, error);
  } else {
    console.log(`Success! Updated row:`, data?.[0]);
  }
}

async function run() {
  try {
    await updateOrderScreenshot('MANTRA-406066', 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500');
    await updateOrderScreenshot('MANTRA-180374', 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=500');
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
