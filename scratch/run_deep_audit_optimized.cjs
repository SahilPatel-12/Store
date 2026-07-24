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

// Normalize phone numbers to 12-digit Indian format (e.g. 918819897434)
function normalizePhone(phone) {
  if (!phone) return null;
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) return '91' + clean;
  if (clean.length === 12 && clean.startsWith('91')) return clean;
  if (clean.length > 10) {
    return '91' + clean.slice(-10);
  }
  return clean;
}

// Check if a value contains a UUID string recursively
function searchValForId(val, id) {
  if (!val) return false;
  if (typeof val === 'string') {
    return val === id || val.includes(id);
  }
  if (typeof val === 'object') {
    try {
      const str = JSON.stringify(val);
      return str.includes(id);
    } catch (e) {
      return false;
    }
  }
  return false;
}

async function run() {
  try {
    console.log('1. Loading active tables...');
    const countData = JSON.parse(fs.readFileSync(path.join(__dirname, 'db_inventory_row_counts.json'), 'utf8'));
    // Filter active tables (success and count > 0)
    const activeTables = countData.successTables.filter(t => t.count > 0).map(t => t.table);
    console.log(`Found ${activeTables.length} active tables.`);

    console.log('2. Fetching all website store users...');
    const { data: users, error: userError } = await supabase
      .from('website_store_users')
      .select('*');
    if (userError) throw userError;

    // Group users by normalized phone
    const phoneGroups = {};
    users.forEach(u => {
      const norm = normalizePhone(u.phone_number);
      if (!norm) return;
      if (!phoneGroups[norm]) phoneGroups[norm] = [];
      phoneGroups[norm].push(u);
    });

    // Extract duplicate groups (groups with count > 1)
    const duplicateGroups = {};
    const allDuplicateUserIds = [];
    Object.keys(phoneGroups).forEach(norm => {
      if (phoneGroups[norm].length > 1) {
        duplicateGroups[norm] = phoneGroups[norm];
        phoneGroups[norm].forEach(u => allDuplicateUserIds.push(u.id));
      }
    });

    console.log(`Found ${Object.keys(duplicateGroups).length} duplicate phone groups with ${allDuplicateUserIds.length} user records.`);

    // 3. Fetch all records from all active tables in parallel
    console.log('3. Downloading active database records...');
    const dbData = {};
    
    // We fetch in small batches of parallel calls to avoid connection limits
    const batchSize = 15;
    for (let i = 0; i < activeTables.length; i += batchSize) {
      const batch = activeTables.slice(i, i + batchSize);
      const promises = batch.map(async (table) => {
        try {
          const { data, error } = await supabase.from(table).select('*');
          if (error) {
            console.error(`Error reading table ${table}:`, error.message);
            return { table, data: [] };
          }
          return { table, data };
        } catch (e) {
          console.error(`Exception reading table ${table}:`, e.message);
          return { table, data: [] };
        }
      });
      const results = await Promise.all(promises);
      results.forEach(res => {
        dbData[res.table] = res.data;
      });
    }

    console.log('4. Analyzing references in-memory...');
    const finalGroupsReport = [];

    Object.keys(duplicateGroups).forEach(normPhone => {
      const group = duplicateGroups[normPhone];
      // Sort: raw 10-digit is A, raw 12-digit is B
      const sortedUsers = [...group].sort((a, b) => a.phone_number.length - b.phone_number.length);
      const userA = sortedUsers[0];
      const userB = sortedUsers[1];
      const allIds = sortedUsers.map(u => u.id);

      const groupDetails = {
        normalizedPhone: normPhone,
        duplicateCount: group.length,
        users: sortedUsers.map(u => ({
          id: u.id,
          storedPhone: u.phone_number,
          fullName: u.full_name,
          email: u.email,
          createdAt: u.created_at,
          lastLogin: u.last_login_at,
          affiliateCode: u.affiliate_code,
          referredBy: u.referred_by
        })),
        dependencies: {}
      };

      // Search every active table for these user IDs
      Object.keys(dbData).forEach(table => {
        const rows = dbData[table] || [];
        rows.forEach(row => {
          // Check each column in the row
          Object.keys(row).forEach(col => {
            const val = row[col];
            allIds.forEach(id => {
              if (searchValForId(val, id)) {
                // Determine record ID
                const recordId = row.id || row.order_id || row.session_token || row.key || JSON.stringify(row);
                
                if (!groupDetails.dependencies[table]) {
                  groupDetails.dependencies[table] = [];
                }
                
                // Avoid duplicating matches for the same row & column
                const exists = groupDetails.dependencies[table].some(
                  d => d.recordId === recordId && d.column === col && d.userId === id
                );
                
                if (!exists) {
                  groupDetails.dependencies[table].push({
                    column: col,
                    userId: id,
                    recordId: recordId,
                    details: row
                  });
                }
              }
            });
          });
        });
      });

      // Self referrals
      const referredByMatches = [];
      const refereeMatches = [];
      
      sortedUsers.forEach(u => {
        const referees = users.filter(usr => usr.referred_by === u.id);
        if (referees.length > 0) {
          refereeMatches.push(...referees.map(r => ({
            referrerId: u.id,
            refereeId: r.id,
            refereePhone: r.phone_number
          })));
        }
        if (u.referred_by) {
          referredByMatches.push({
            userId: u.id,
            referredById: u.referred_by
          });
        }
      });

      groupDetails.referrals = {
        referredBy: referredByMatches,
        referees: refereeMatches
      };

      finalGroupsReport.push(groupDetails);
    });

    const outputPath = path.join(__dirname, 'deep_audit_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalGroupsReport, null, 2));
    console.log(`Deep audit finished! Optimized results written to ${outputPath}`);

  } catch (err) {
    console.error('Audit exception:', err);
  }
}

run();
