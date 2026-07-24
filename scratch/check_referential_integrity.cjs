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

// Define tables and columns pointing to website_store_users.id
const FK_REFERENCES = [
  { table: 'user_sessions', column: 'user_id' },
  { table: 'website_store_orders', column: 'user_id' },
  { table: 'website_store_orders', column: 'referrer_id' },
  { table: 'website_store_addresses', column: 'user_id' },
  { table: 'website_store_pundits', column: 'user_id' },
  { table: 'website_store_pundit_bookings', column: 'pundit_id' },
  { table: 'website_store_pundit_bookings', column: 'user_id' }, // application level devotee reference
  { table: 'affiliate_wallets', column: 'user_id' },
  { table: 'affiliate_commissions', column: 'referrer_id' },
  { table: 'affiliate_commissions', column: 'buyer_id' },
  { table: 'affiliate_relationships', column: 'referrer_id' },
  { table: 'affiliate_relationships', column: 'referred_id' },
  { table: 'affiliate_clicks', column: 'referrer_id' },
  { table: 'affiliate_withdrawals', column: 'user_id' }
];

async function run() {
  try {
    console.log('Fetching website_store_users IDs...');
    const { data: users, error: userErr } = await supabase
      .from('website_store_users')
      .select('id');
    if (userErr) throw userErr;

    const userIds = new Set(users.map(u => u.id));
    console.log(`Total active user IDs in website_store_users: ${userIds.size}`);

    const orphanSummary = [];

    for (const ref of FK_REFERENCES) {
      try {
        console.log(`Checking table ${ref.table}.${ref.column}...`);
        const { data, error } = await supabase
          .from(ref.table)
          .select('*');
        
        if (error) {
          console.error(`Error reading ${ref.table}:`, error.message);
          continue;
        }

        const orphans = [];
        data.forEach(row => {
          const val = row[ref.column];
          if (val && !userIds.has(val)) {
            orphans.push({
              primaryKey: row.id || row.order_id || row.key || JSON.stringify(row),
              value: val
            });
          }
        });

        if (orphans.length > 0) {
          console.log(`FOUND ${orphans.length} ORPHANED ROWS in ${ref.table}.${ref.column}!`);
          orphanSummary.push({
            table: ref.table,
            column: ref.column,
            orphans
          });
        }
      } catch (err) {
        console.error(`Exception reading ${ref.table}:`, err.message);
      }
    }

    fs.writeFileSync(
      path.join(__dirname, 'orphan_verification_results.json'),
      JSON.stringify(orphanSummary, null, 2)
    );
    console.log('Orphan checks finished. Summary saved to orphan_verification_results.json');
  } catch (err) {
    console.error('Integrity audit exception:', err);
  }
}

run();
