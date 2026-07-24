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
    // Treat as ending 10 digits prefixed with 91
    return '91' + clean.slice(-10);
  }
  return clean;
}

// Columns to search for UUID direct matches
const REFERENCE_COLUMNS = [
  'user_id', 'customer_id', 'buyer_id', 'referrer_id', 'referred_id',
  'referee_id', 'pundit_id', 'affiliate_id', 'owner_id', 'created_by', 'updated_by'
];

// JSONB or Text columns that might contain user UUIDs
const JSON_TEXT_COLUMNS = [
  'items', 'metadata', 'shipping_address', 'customer_data', 'user_data', 'payment_metadata', 'affiliate_snapshot'
];

async function run() {
  try {
    console.log('1. Loading openapi_schema.json...');
    const schemaPath = path.join(__dirname, 'openapi_schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    // Find all tables and columns from schema
    const tableStructures = {};
    Object.keys(schema.definitions || {}).forEach(tableName => {
      const def = schema.definitions[tableName];
      tableStructures[tableName] = [];
      if (def.properties) {
        Object.keys(def.properties).forEach(colName => {
          tableStructures[tableName].push(colName);
        });
      }
    });

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
    let totalDuplicateUsers = 0;
    Object.keys(phoneGroups).forEach(norm => {
      if (phoneGroups[norm].length > 1) {
        duplicateGroups[norm] = phoneGroups[norm];
        totalDuplicateUsers += phoneGroups[norm].length;
      }
    });

    console.log(`Found ${Object.keys(duplicateGroups).length} duplicate phone groups with ${totalDuplicateUsers} user records.`);

    // Map which tables have which search columns
    const searchTargets = []; // { table, column, isJson }
    Object.keys(tableStructures).forEach(table => {
      const cols = tableStructures[table];
      cols.forEach(col => {
        if (REFERENCE_COLUMNS.includes(col)) {
          searchTargets.push({ table, column: col, isJson: false });
        } else if (JSON_TEXT_COLUMNS.includes(col)) {
          searchTargets.push({ table, column: col, isJson: true });
        }
      });
    });

    console.log(`Discovered ${searchTargets.length} columns in DB to scan for user references.`);

    // Perform deep dependency search for all duplicate users
    const auditResults = [];

    let processedGroups = 0;
    for (const [normPhone, group] of Object.entries(duplicateGroups)) {
      console.log(`Processing group ${++processedGroups}/${Object.keys(duplicateGroups).length}: ${normPhone}`);

      // Sort users: 12-digit format should ideally be the target, but we'll list both
      // We will sort so that the shorter raw phone number (10-digit) is User A and longer (12-digit) is User B.
      const sortedUsers = [...group].sort((a, b) => a.phone_number.length - b.phone_number.length);
      const userA = sortedUsers[0];
      const userB = sortedUsers[1];
      const extraUsers = sortedUsers.slice(2); // in case there are > 2 duplicates

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

      // Query all scan columns for each user in this group
      const allUserIdsInGroup = sortedUsers.map(u => u.id);
      
      // Let's create an entry in dependencies for each table/column combo
      for (const target of searchTargets) {
        const { table, column, isJson } = target;
        
        try {
          let matches = [];
          if (isJson) {
            // Since we can't easily do JSON contain via simple Rest API for all kinds of json structures 
            // unless we do string matching or check if columns exist.
            // Let's use filter with raw string match or check if it's text.
            // In PostgreSQL, to search for a UUID string in JSON or TEXT, we can use `like.%uuid%` or `.filter(col, 'cs', '{"key": "value"}')`
            // Let's execute a like search on JSONB columns. PostgREST allows `.fts` (full-text search) or `.like` if cast, but 
            // supabase-js supports `.or` or `.filter(col, 'like', '%uuid%')` on text columns.
            // If it's jsonb, PostgREST supports contains `cs` or we can try `.filter(column, 'like', `%${id}%`)`.
            // Let's search each UUID using filter:
            for (const id of allUserIdsInGroup) {
              const { data, error } = await supabase
                .from(table)
                .select('*')
                .filter(column, 'like', `%${id}%`);
              
              if (!error && data && data.length > 0) {
                matches.push(...data.map(row => ({ row, column, userId: id })));
              }
            }
          } else {
            // Direct UUID matching
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .in(column, allUserIdsInGroup);
            
            if (!error && data && data.length > 0) {
              data.forEach(row => {
                matches.push({ row, column, userId: row[column] });
              });
            }
          }

          if (matches.length > 0) {
            if (!groupDetails.dependencies[table]) {
              groupDetails.dependencies[table] = [];
            }
            matches.forEach(m => {
              // Find which primary key or unique identifier this row has
              const rowId = m.row.id || m.row.order_id || m.row.session_token || m.row.key || JSON.stringify(m.row);
              groupDetails.dependencies[table].push({
                column: m.column,
                userId: m.userId,
                recordId: rowId,
                details: m.row
              });
            });
          }
        } catch (colErr) {
          // Skip columns that fail (e.g. if table not readable or column type mismatch)
        }
      }

      // Also check self-referencing links within website_store_users itself
      // e.g. referred_by pointing to any of these IDs, or these IDs pointing to referred_by
      const referredByMatches = [];
      const refereeMatches = [];
      
      for (const u of sortedUsers) {
        // Did this user refer someone?
        const referees = users.filter(usr => usr.referred_by === u.id);
        if (referees.length > 0) {
          refereeMatches.push(...referees.map(r => ({
            referrerId: u.id,
            refereeId: r.id,
            refereePhone: r.phone_number
          })));
        }

        // Who referred this user?
        if (u.referred_by) {
          referredByMatches.push({
            userId: u.id,
            referredById: u.referred_by
          });
        }
      }

      groupDetails.referrals = {
        referredBy: referredByMatches,
        referees: refereeMatches
      };

      auditResults.push(groupDetails);
    }

    const outputPath = path.join(__dirname, 'deep_audit_raw_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2));
    console.log(`Deep audit finished! Raw results written to ${outputPath}`);

  } catch (err) {
    console.error('Audit exception:', err);
  }
}

run();
