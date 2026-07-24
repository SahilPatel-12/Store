const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'duplicate_audit_results.json');
const duplicates = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log(`=== DUPLICATE GROUPS SUMMARY (Total: ${duplicates.length}) ===\n`);

const safeToMerge = [];
const requiresReview = [];

duplicates.forEach((group, index) => {
  const norm = group.normalizedPhone;
  const users = group.users;
  
  // Track users with non-session data
  const usersWithData = [];
  
  users.forEach(u => {
    const hasData = u.counts.orders > 0 || 
                    u.counts.addresses > 0 || 
                    u.counts.affiliates > 0 || 
                    u.counts.couponRedemptions > 0 || 
                    u.counts.devoteeBookings > 0 || 
                    u.counts.punditBookings > 0;
    if (hasData) {
      usersWithData.push(u);
    }
  });

  if (usersWithData.length <= 1) {
    // Determine the canonical user (the one with data, or the oldest one)
    let canonical = null;
    if (usersWithData.length === 1) {
      canonical = usersWithData[0];
    } else {
      // No business data, pick the one with active session, or the first one
      const withSession = users.find(u => u.counts.sessions > 0);
      canonical = withSession || users[0];
    }
    
    const others = users.filter(u => u.id !== canonical.id);
    
    safeToMerge.push({
      normalizedPhone: norm,
      canonicalId: canonical.id,
      canonicalPhone: canonical.rawPhone,
      canonicalCounts: canonical.counts,
      removedUsers: others.map(o => ({ id: o.id, phone: o.rawPhone, counts: o.counts }))
    });
  } else {
    requiresReview.push({
      normalizedPhone: norm,
      users: users.map(u => ({
        id: u.id,
        phone: u.rawPhone,
        email: u.email,
        counts: u.counts
      }))
    });
  }
});

console.log(`SAFE TO MERGE AUTOMATICALLY: ${safeToMerge.length}`);
safeToMerge.forEach(g => {
  console.log(`- Phone: ${g.normalizedPhone} | Keep: ${g.canonicalPhone} (Orders: ${g.canonicalCounts.orders}, Addr: ${g.canonicalCounts.addresses}) | Merge/Delete: ${g.removedUsers.map(r => r.phone).join(', ')}`);
});

console.log(`\nREQUIRES MANUAL REVIEW / CONFLICTING: ${requiresReview.length}`);
requiresReview.forEach(g => {
  console.log(`- Phone: ${g.normalizedPhone}`);
  g.users.forEach(u => {
    console.log(`  * ID: ${u.id} | Phone: ${u.phone} | Orders: ${u.counts.orders} | Addresses: ${u.counts.addresses} | Sessions: ${u.counts.sessions}`);
  });
});

fs.writeFileSync(
  path.join(__dirname, 'duplicate_classification.json'),
  JSON.stringify({ safeToMerge, requiresReview }, null, 2)
);
