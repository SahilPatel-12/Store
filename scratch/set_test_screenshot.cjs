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

async function run() {
  try {
    const orderId = 'MANTRA-354910';
    // Let's use a sample temple image as a placeholder for the payment screenshot
    const testUrl = 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=500';

    console.log(`Updating order #${orderId} with test screenshot: ${testUrl}`);
    const { data, error } = await supabase
      .from('website_store_orders')
      .update({ payment_screenshot: testUrl })
      .eq('order_id', orderId)
      .select();

    if (error) {
      console.error('Update Error:', error);
      return;
    }

    console.log('Update successful! Row updated:');
    console.log(data);
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
