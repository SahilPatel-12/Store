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
    console.log('Fetching affiliate data...');
    const [wallets, commissions, relationships, clicks] = await Promise.all([
      supabase.from('affiliate_wallets').select('*'),
      supabase.from('affiliate_commissions').select('*'),
      supabase.from('affiliate_relationships').select('*'),
      supabase.from('affiliate_clicks').select('*')
    ]);

    console.log(`Wallets: ${wallets.data?.length || 0}`);
    console.log(`Commissions: ${commissions.data?.length || 0}`);
    console.log(`Relationships: ${relationships.data?.length || 0}`);
    console.log(`Clicks: ${clicks.data?.length || 0}`);

    // Check duplicate wallets by user_id
    const walletUserMap = {};
    const dupWallets = [];
    wallets.data?.forEach(w => {
      if (walletUserMap[w.user_id]) {
        dupWallets.push(w);
      } else {
        walletUserMap[w.user_id] = w;
      }
    });

    // Check duplicate commissions by order_id
    const commissionOrderMap = {};
    const dupCommissions = [];
    commissions.data?.forEach(c => {
      if (commissionOrderMap[c.order_id]) {
        dupCommissions.push(c);
      } else {
        commissionOrderMap[c.order_id] = c;
      }
    });

    console.log('\n=== AFFILIATE DUPLICATION REPORT ===');
    console.log(`Duplicate Wallets by User ID: ${dupWallets.length}`);
    console.log(`Duplicate Commissions by Order ID: ${dupCommissions.length}`);

    fs.writeFileSync(
      path.join(__dirname, 'affiliate_audit_results.json'),
      JSON.stringify({
        wallets: wallets.data,
        commissions: commissions.data,
        relationships: relationships.data,
        clicks: clicks.data,
        duplicates: {
          wallets: dupWallets,
          commissions: dupCommissions
        }
      }, null, 2)
    );
    console.log('\nAffiliate audit results saved to affiliate_audit_results.json');

  } catch (err) {
    console.error('Exception during affiliate audit:', err);
  }
}

run();
