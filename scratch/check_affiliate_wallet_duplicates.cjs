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
    // 1. Fetch duplicate classification results
    const resultsPath = path.join(__dirname, 'duplicate_audit_results.json');
    const duplicates = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Extract all user IDs in duplicate groups
    const duplicateUserIds = [];
    duplicates.forEach(group => {
      group.users.forEach(u => {
        duplicateUserIds.push(u.id);
      });
    });

    console.log(`Analyzing duplicate users (${duplicateUserIds.length} user IDs) for affiliate wallets...`);

    // 2. Fetch all affiliate wallets
    const { data: wallets, error } = await supabase
      .from('affiliate_wallets')
      .select('*');

    if (error) {
      console.error('Error fetching affiliate wallets:', error);
      return;
    }

    console.log(`Total affiliate wallets: ${wallets.length}`);

    const matchingWallets = wallets.filter(w => duplicateUserIds.includes(w.user_id));
    console.log(`Matching affiliate wallets for duplicate users: ${matchingWallets.length}`);

    matchingWallets.forEach(w => {
      // Find the user info
      let matchingUser = null;
      let matchingPhone = null;
      duplicates.forEach(group => {
        const found = group.users.find(u => u.id === w.user_id);
        if (found) {
          matchingUser = found;
          matchingPhone = group.normalizedPhone;
        }
      });

      console.log(`- Wallet owner: ${w.user_id} | Raw Phone: ${matchingUser?.rawPhone} | Normalized: ${matchingPhone} | Total Earned: ${w.total_earned} | Available: ${w.available_balance}`);
    });

  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
