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

// Read tables from openapi schema definitions
const schemaPath = path.join(__dirname, 'openapi_schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const tableNames = Object.keys(schema.definitions || {}).sort();

async function run() {
  console.log(`Auditing row counts for ${tableNames.length} tables...`);
  const results = [];
  
  // Query in batches to avoid overwhelming the REST API
  const batchSize = 10;
  for (let i = 0; i < tableNames.length; i += batchSize) {
    const batch = tableNames.slice(i, i + batchSize);
    const promises = batch.map(async (tbl) => {
      try {
        const { count, error } = await supabase
          .from(tbl)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          return { table: tbl, count: -1, error: error.message };
        }
        return { table: tbl, count: count, error: null };
      } catch (err) {
        return { table: tbl, count: -1, error: err.message };
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    console.log(`Processed ${Math.min(i + batchSize, tableNames.length)} / ${tableNames.length} tables...`);
  }

  // Filter out tables that returned errors (mostly views or system schemas not queryable)
  const successTables = results.filter(r => r.count !== -1);
  const failedTables = results.filter(r => r.count === -1);

  console.log(`\nSuccessfully audited: ${successTables.length} tables`);
  console.log(`Failed/Skipped: ${failedTables.length} tables`);

  fs.writeFileSync(
    path.join(__dirname, 'db_inventory_row_counts.json'),
    JSON.stringify({ successTables, failedTables }, null, 2)
  );
  console.log('Row counts saved to db_inventory_row_counts.json');
}

run();
