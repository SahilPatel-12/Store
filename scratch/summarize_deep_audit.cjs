const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'deep_audit_results.json');
const groups = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('Total website users: 152');
console.log('Total duplicate phone groups: ' + groups.length);
console.log('Total duplicate user records: ' + groups.reduce((acc, g) => acc + g.duplicateCount, 0));

// Count category classification
// Category A: Empty Duplicate (no orders, no addresses, no sessions, no wallets, no affiliate data, no bookings)
// Category B: Non-conflicting business data (only one of the users has data, or both have none - excluding financial)
// Category C: Both users have active orders or addresses (Requires Manual Review)
// Category D: High-Risk Financial/Affiliate (wallet, commission, clicks, relationship, withdrawal)

const catA = [];
const catB = [];
const catC = [];
const catD = [];

const tableDependencyMatrix = {};

groups.forEach(g => {
  const userA = g.users[0];
  const userB = g.users[1];
  
  // Aggregate dependencies by table for User A vs User B
  const countsA = {};
  const countsB = {};
  
  Object.keys(g.dependencies).forEach(table => {
    if (!tableDependencyMatrix[table]) {
      tableDependencyMatrix[table] = { totalA: 0, totalB: 0 };
    }
    
    const records = g.dependencies[table];
    records.forEach(r => {
      if (r.userId === userA.id) {
        countsA[table] = (countsA[table] || 0) + 1;
        tableDependencyMatrix[table].totalA++;
      } else if (r.userId === userB.id) {
        countsB[table] = (countsB[table] || 0) + 1;
        tableDependencyMatrix[table].totalB++;
      }
    });
  });

  const hasOrdersA = countsA['website_store_orders'] > 0;
  const hasOrdersB = countsB['website_store_orders'] > 0;
  const hasAddressesA = countsA['website_store_addresses'] > 0;
  const hasAddressesB = countsB['website_store_addresses'] > 0;
  
  // Check financial/affiliate dependencies
  const financialTables = [
    'affiliate_wallets', 'affiliate_commissions', 'affiliate_relationships', 
    'affiliate_clicks', 'affiliate_withdrawals', 'website_store_affiliates'
  ];
  
  let hasFinancialA = false;
  let hasFinancialB = false;
  
  financialTables.forEach(t => {
    if (countsA[t] > 0) hasFinancialA = true;
    if (countsB[t] > 0) hasFinancialB = true;
  });

  const totalDepsA = Object.values(countsA).reduce((a, b) => a + b, 0);
  const totalDepsB = Object.values(countsB).reduce((a, b) => a + b, 0);

  const groupInfo = {
    phone: g.normalizedPhone,
    userA: { id: userA.id, storedPhone: userA.storedPhone, name: userA.fullName, counts: countsA, total: totalDepsA },
    userB: { id: userB.id, storedPhone: userB.storedPhone, name: userB.fullName, counts: countsB, total: totalDepsB }
  };

  if (hasFinancialA || hasFinancialB) {
    catD.push(groupInfo);
  } else if ((hasOrdersA && hasOrdersB) || (hasAddressesA && hasAddressesB)) {
    catC.push(groupInfo);
  } else if (totalDepsA > 0 || totalDepsB > 0) {
    catB.push(groupInfo);
  } else {
    catA.push(groupInfo);
  }
});

console.log('\n=== CATEGORY STATS ===');
console.log(`Category A (Empty): ${catA.length}`);
console.log(`Category B (Non-Conflicting data): ${catB.length}`);
console.log(`Category C (Conflict Orders/Addr - Manual Review): ${catC.length}`);
console.log(`Category D (Financial/Affiliate - High-Risk): ${catD.length}`);

console.log('\n=== TABLE DEPENDENCY MATRIX ===');
Object.keys(tableDependencyMatrix).forEach(t => {
  const m = tableDependencyMatrix[t];
  console.log(`${t}: User A total = ${m.totalA}, User B total = ${m.totalB}`);
});

console.log('\n=== DETAILED CONFLICTS AND HIGH RISK ===');
console.log('--- CATEGORY D (Financial/Affiliate) ---');
catD.forEach(c => {
  console.log(`Phone: ${c.phone}`);
  console.log(`  User A (${c.userA.id} / ${c.userA.storedPhone}):`, c.userA.counts);
  console.log(`  User B (${c.userB.id} / ${c.userB.storedPhone}):`, c.userB.counts);
});

console.log('--- CATEGORY C (Manual Review Conflicts) ---');
catC.forEach(c => {
  console.log(`Phone: ${c.phone}`);
  console.log(`  User A (${c.userA.id} / ${c.userA.storedPhone}):`, c.userA.counts);
  console.log(`  User B (${c.userB.id} / ${c.userB.storedPhone}):`, c.userB.counts);
});

console.log('\n=== GROUPS WITH BUSINESS DATA SUMMARY ===');
const withOrders = groups.filter(g => {
  return g.dependencies['website_store_orders'] && g.dependencies['website_store_orders'].length > 0;
});
console.log(`Groups with orders: ${withOrders.length}`);

const withAddresses = groups.filter(g => {
  return g.dependencies['website_store_addresses'] && g.dependencies['website_store_addresses'].length > 0;
});
console.log(`Groups with addresses: ${withAddresses.length}`);

const withAffiliate = groups.filter(g => {
  const financialTables = [
    'affiliate_wallets', 'affiliate_commissions', 'affiliate_relationships', 
    'affiliate_clicks', 'affiliate_withdrawals', 'website_store_affiliates'
  ];
  return Object.keys(g.dependencies).some(t => financialTables.includes(t));
});
console.log(`Groups with affiliate/financial data: ${withAffiliate.length}`);
