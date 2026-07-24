const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables
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

async function run() {
  try {
    console.log('Fetching all website orders...');
    const { data: orders, error } = await supabase
      .from('website_store_orders')
      .select('*');

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    console.log(`Total orders found: ${orders.length}`);

    const attemptMap = {};
    const rzpOrderMap = {};
    const rzpPaymentMap = {};
    
    const dupAttempts = [];
    const dupRzpOrders = [];
    const dupRzpPayments = [];

    orders.forEach(o => {
      // Idempotency checkout attempt check
      if (o.checkout_attempt_id) {
        if (attemptMap[o.checkout_attempt_id]) {
          dupAttempts.push({ existing: attemptMap[o.checkout_attempt_id], duplicate: o });
        } else {
          attemptMap[o.checkout_attempt_id] = o;
        }
      }

      // Razorpay Order ID check
      if (o.razorpay_order_id) {
        if (rzpOrderMap[o.razorpay_order_id]) {
          dupRzpOrders.push({ existing: rzpOrderMap[o.razorpay_order_id], duplicate: o });
        } else {
          rzpOrderMap[o.razorpay_order_id] = o;
        }
      }

      // Razorpay Payment ID check
      if (o.razorpay_payment_id) {
        if (rzpPaymentMap[o.razorpay_payment_id]) {
          dupRzpPayments.push({ existing: rzpPaymentMap[o.razorpay_payment_id], duplicate: o });
        } else {
          rzpPaymentMap[o.razorpay_payment_id] = o;
        }
      }
    });

    console.log('\n=== WEBSITE ORDER DUPLICATION REPORT ===');
    console.log(`Duplicate Checkout Attempt IDs: ${dupAttempts.length}`);
    dupAttempts.forEach(d => {
      console.log(`- Attempt "${d.duplicate.checkout_attempt_id}":\n  * Order ${d.existing.order_id} | Created: ${d.existing.created_at} | Status: ${d.existing.status}\n  * Order ${d.duplicate.order_id} | Created: ${d.duplicate.created_at} | Status: ${d.duplicate.status}`);
    });

    console.log(`Duplicate Razorpay Order IDs: ${dupRzpOrders.length}`);
    dupRzpOrders.forEach(d => {
      console.log(`- RZP Order ID "${d.duplicate.razorpay_order_id}":\n  * Order ${d.existing.order_id} | Total: ${d.existing.total}\n  * Order ${d.duplicate.order_id} | Total: ${d.duplicate.total}`);
    });

    console.log(`Duplicate Razorpay Payment IDs: ${dupRzpPayments.length}`);
    dupRzpPayments.forEach(d => {
      console.log(`- RZP Payment ID "${d.duplicate.razorpay_payment_id}":\n  * Order ${d.existing.order_id}\n  * Order ${d.duplicate.order_id}`);
    });

    // Check payment methods split
    const paymentMethods = {};
    orders.forEach(o => {
      const pm = o.payment_method || 'unknown';
      paymentMethods[pm] = (paymentMethods[pm] || 0) + 1;
    });
    console.log('\n=== Orders by Payment Method ===');
    console.log(paymentMethods);

    fs.writeFileSync(
      path.join(__dirname, 'order_audit_results.json'),
      JSON.stringify({ total: orders.length, paymentMethods, dupAttempts, dupRzpOrders, dupRzpPayments }, null, 2)
    );
    console.log('\nOrder audit results saved to order_audit_results.json');

  } catch (err) {
    console.error('Exception during order audit:', err);
  }
}

run();
