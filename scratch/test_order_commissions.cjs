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
    console.log('--- STARTING COMMISSION TRIGGER AND WALLET TESTS ---');

    // 1. Fetch a user who has a referrer (referred_by is not null)
    const { data: users, error: userErr } = await supabase
      .from('website_store_users')
      .select('id, full_name, referred_by')
      .not('referred_by', 'is', null)
      .limit(1);

    if (userErr) throw userErr;
    if (!users || users.length === 0) {
      console.warn('No referred users found in the database. Please run seed_referral_tree.cjs first.');
      return;
    }

    const devotee = users[0];
    console.log(`Using devotee for test: ${devotee.full_name} (${devotee.id}) referred by: ${devotee.referred_by}`);

    // Fetch initial wallet state for referrer
    const { data: initialWallet, error: walletErr } = await supabase
      .from('affiliate_wallets')
      .select('*')
      .eq('user_id', devotee.referred_by)
      .maybeSingle();

    if (walletErr) throw walletErr;
    const initialPending = initialWallet ? parseFloat(initialWallet.pending_earnings) : 0;
    console.log(`Referrer initial pending balance: ₹${initialPending}`);

    // 2. Insert dummy order for the devotee
    const orderId = `TEST_${Math.floor(100000 + Math.random() * 900000)}`;
    const orderTotal = 1500.00; // Rs 1500 order

    console.log(`Inserting dummy order ${orderId} for ₹${orderTotal}...`);
    const { data: order, error: orderErr } = await supabase
      .from('website_store_orders')
      .insert({
        order_id: orderId,
        user_id: devotee.id,
        subtotal: orderTotal,
        discount: 0.00,
        discount_percent: 0,
        shipping: 0.00,
        tax: 0.00,
        total: orderTotal,
        payment_method: 'UPI',
        delivery_city: 'Jabalpur',
        delivery_state: 'Madhya Pradesh',
        full_name: devotee.full_name || 'Test User',
        email: 'test@devotion.com',
        address_line1: '123 Temple Road',
        pincode: '482001',
        phone_number: '9999999999',
        status: 'Pending Payment',
        items: JSON.stringify([{ id: 1, name: 'Pooja Kit', quantity: 1, price: 1500 }])
      })
      .select('*')
      .single();

    if (orderErr) throw orderErr;
    console.log(`Order created successfully! Database ID: ${order.id}`);

    // Wait a brief moment for database trigger execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Check affiliate_commissions entries
    console.log(`Checking public.affiliate_commissions for order_id: ${orderId}...`);
    const { data: commissions, error: commErr } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('order_id', orderId);

    if (commErr) throw commErr;
    console.log(`Found ${commissions.length} commission entries:`);
    commissions.forEach(c => {
      console.log(`- Referrer: ${c.referrer_id}, Level: ${c.level}, Rate: ${c.commission_percent}%, Amount: ₹${c.commission_amount}, Status: ${c.status}`);
    });

    // 4. Check affiliate_snapshot inside the order
    console.log('Checking order affiliate_snapshot...');
    const { data: updatedOrder, error: orderCheckErr } = await supabase
      .from('website_store_orders')
      .select('affiliate_snapshot, referrer_id')
      .eq('id', order.id)
      .single();

    if (orderCheckErr) throw orderCheckErr;
    console.log('Order Referrer ID set to:', updatedOrder.referrer_id);
    console.log('Snapshot value:', JSON.stringify(updatedOrder.affiliate_snapshot, null, 2));

    // 5. Verify wallet balance increment
    const { data: updatedWallet, error: walletCheckErr } = await supabase
      .from('affiliate_wallets')
      .select('*')
      .eq('user_id', devotee.referred_by)
      .maybeSingle();

    if (walletCheckErr) throw walletCheckErr;
    const finalPending = updatedWallet ? parseFloat(updatedWallet.pending_earnings) : 0;
    console.log(`Referrer final pending balance: ₹${finalPending}`);
    console.log(`Difference: ₹${finalPending - initialPending}`);

    // 6. Test lifecycle transition to Delivered
    console.log('Transitioning order status to Delivered...');
    const { error: updateStatusErr } = await supabase
      .from('website_store_orders')
      .update({ status: 'Delivered' })
      .eq('id', order.id);

    if (updateStatusErr) throw updateStatusErr;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check commission status
    const { data: deliveredCommissions, error: delCommErr } = await supabase
      .from('affiliate_commissions')
      .select('status')
      .eq('order_id', orderId);

    if (delCommErr) throw delCommErr;
    console.log('Delivered commission status transitions:');
    deliveredCommissions.forEach(c => {
      console.log(`- Status: ${c.status}`);
    });

    // 7. Test lifecycle transition to Cancelled (should refund wallet)
    console.log('Transitioning order status to Cancelled...');
    const { error: cancelStatusErr } = await supabase
      .from('website_store_orders')
      .update({ status: 'Cancelled' })
      .eq('id', order.id);

    if (cancelStatusErr) throw cancelStatusErr;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check wallet balance reversed
    const { data: cancelledWallet, error: walletCancelErr } = await supabase
      .from('affiliate_wallets')
      .select('*')
      .eq('user_id', devotee.referred_by)
      .maybeSingle();

    if (walletCancelErr) throw walletCancelErr;
    const cancelledPending = cancelledWallet ? parseFloat(cancelledWallet.pending_earnings) : 0;
    console.log(`Referrer pending balance after Cancellation: ₹${cancelledPending}`);

    // Clean up test order
    console.log('Cleaning up test data...');
    await supabase.from('affiliate_commissions').delete().eq('order_id', orderId);
    await supabase.from('website_store_orders').delete().eq('id', order.id);
    console.log('Cleanup completed successfully!');

  } catch (err) {
    console.error('Error during testing:', err.message);
  }
}

run();
