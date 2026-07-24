const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'deep_audit_results.json');
const groups = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

const ordersList = [];
const addressesList = [];
const sessionsList = [];
const affiliateList = [];

groups.forEach(g => {
  const phone = g.normalizedPhone;
  
  Object.keys(g.dependencies).forEach(table => {
    const records = g.dependencies[table];
    
    records.forEach(r => {
      const details = r.details;
      
      if (table === 'website_store_orders') {
        ordersList.push({
          normalizedPhone: phone,
          userId: r.userId,
          orderId: details.order_id,
          id: details.id,
          referrerId: details.referrer_id,
          status: details.status,
          paymentStatus: details.payment_status,
          paymentProvider: details.payment_method,
          total: details.total,
          createdAt: details.created_at,
          razorpayOrderId: details.razorpay_order_id,
          razorpayPaymentId: details.razorpay_payment_id,
          checkoutAttemptId: details.checkout_attempt_id
        });
      } else if (table === 'website_store_addresses') {
        addressesList.push({
          normalizedPhone: phone,
          userId: r.userId,
          addressId: details.id,
          name: details.full_name,
          phone: details.phone,
          address: `${details.address_line1 || ''} ${details.address_line2 || ''}`.trim(),
          city: details.city,
          state: details.state,
          postalCode: details.pincode,
          createdAt: details.created_at
        });
      } else if (table === 'user_sessions') {
        sessionsList.push({
          normalizedPhone: phone,
          userId: r.userId,
          sessionId: details.id,
          token: details.session_token,
          createdAt: details.created_at,
          expiresAt: details.expires_at,
          lastActivity: details.last_activity
        });
      } else if (['affiliate_wallets', 'affiliate_commissions', 'affiliate_relationships', 'affiliate_clicks', 'affiliate_withdrawals', 'website_store_affiliates', 'affiliate_audit_logs'].includes(table)) {
        affiliateList.push({
          table: table,
          normalizedPhone: phone,
          userId: r.userId,
          recordId: r.recordId,
          column: r.column,
          details: details
        });
      }
    });
  });
});

console.log(`Total orders found referencing duplicate UUIDs: ${ordersList.length}`);
console.log(`Total addresses found referencing duplicate UUIDs: ${addressesList.length}`);
console.log(`Total sessions found referencing duplicate UUIDs: ${sessionsList.length}`);
console.log(`Total affiliate/financial rows referencing duplicate UUIDs: ${affiliateList.length}`);

// Write lists to disk for easy reference
fs.writeFileSync(path.join(__dirname, 'affected_orders.json'), JSON.stringify(ordersList, null, 2));
fs.writeFileSync(path.join(__dirname, 'affected_addresses.json'), JSON.stringify(addressesList, null, 2));
fs.writeFileSync(path.join(__dirname, 'affected_sessions.json'), JSON.stringify(sessionsList, null, 2));
fs.writeFileSync(path.join(__dirname, 'affected_affiliate.json'), JSON.stringify(affiliateList, null, 2));

console.log('Affected record json lists saved.');
