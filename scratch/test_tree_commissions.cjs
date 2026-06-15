const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables from .env.local
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
    console.log('--- STARTING MULTI-LEVEL COMMISSION ENGINE TEST ---');

    // Devotee Amit (User 3) referred by Devotee Ramesh (User 2) referred by Sahil Patel (User 1)
    const amitId = '31720205-e04f-49b4-afc3-bf3f9a6c3f72';
    const rameshId = '096c5fa7-1373-433f-ada3-c331e63bc256';
    const sahilId = '32110317-3072-4d8b-9bc2-125598750237';

    // Fetch initial wallets
    const { data: wRamesh } = await supabase.from('affiliate_wallets').select('*').eq('user_id', rameshId).maybeSingle();
    const { data: wSahil } = await supabase.from('affiliate_wallets').select('*').eq('user_id', sahilId).maybeSingle();

    console.log(`Initial Pending: Ramesh = ₹${wRamesh?.pending_earnings || 0}, Sahil = ₹${wSahil?.pending_earnings || 0}`);

    // Insert order for Amit
    const orderId = `TREE_TEST_${Math.floor(100000 + Math.random() * 900000)}`;
    const orderTotal = 2000.00;

    console.log(`Inserting order ${orderId} for ₹${orderTotal} from Amit...`);
    const { data: order, error: orderErr } = await supabase
      .from('website_store_orders')
      .insert({
        order_id: orderId,
        user_id: amitId,
        subtotal: orderTotal,
        discount: 0.00,
        discount_percent: 0,
        shipping: 0.00,
        tax: 0.00,
        total: orderTotal,
        payment_method: 'UPI',
        delivery_city: 'Jabalpur',
        delivery_state: 'Madhya Pradesh',
        full_name: 'Devotee Amit',
        email: 'amit@devotee.com',
        address_line1: '123 Temple Road',
        pincode: '482001',
        phone_number: '7975253851',
        status: 'Pending Payment',
        items: JSON.stringify([{ id: 1, name: 'Premium Puja Thali', quantity: 1, price: 2000 }])
      })
      .select('*')
      .single();

    if (orderErr) throw orderErr;
    console.log(`Order created successfully! Database ID: ${order.id}`);

    // Wait for triggers to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check commissions
    const { data: comms, error: commsErr } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('order_id', orderId);

    if (commsErr) throw commsErr;
    console.log(`Found ${comms.length} commission ledger entries:`);
    comms.forEach(c => {
      console.log(`- Referrer: ${c.referrer_id}, Level: ${c.level}, Percent: ${c.commission_percent}%, Amount: ₹${c.commission_amount}`);
    });

    // Check order snapshot
    const { data: orderWithSnap } = await supabase.from('website_store_orders').select('affiliate_snapshot').eq('id', order.id).single();
    console.log('Order snapshot:', JSON.stringify(orderWithSnap.affiliate_snapshot, null, 2));

    // Check final wallets
    const { data: wRameshPost } = await supabase.from('affiliate_wallets').select('*').eq('user_id', rameshId).maybeSingle();
    const { data: wSahilPost } = await supabase.from('affiliate_wallets').select('*').eq('user_id', sahilId).maybeSingle();

    console.log(`Post Pending: Ramesh = ₹${wRameshPost?.pending_earnings || 0}, Sahil = ₹${wSahilPost?.pending_earnings || 0}`);

    // Clean up
    console.log('Cleaning up...');
    await supabase.from('affiliate_commissions').delete().eq('order_id', orderId);
    await supabase.from('website_store_orders').delete().eq('id', order.id);
    console.log('Cleanup complete!');

  } catch (err) {
    console.error('Error in multi-level test:', err.message);
  }
}

run();
