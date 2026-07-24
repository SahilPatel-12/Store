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
    console.log('Retrieving database schema foreign keys...');
    
    // We will list foreign keys from information_schema
    // Since we cannot run exec_sql directly as RPC, we can search the openapi_schema.json 
    // we downloaded, which has description tags detailing foreign keys!
    // Or we can try executing a raw query if we can find any RPC that executes SQL, 
    // or let's inspect the openapi_schema.json which contains:
    // "description": "Note:\nThis is a Foreign Key to `website_store_users.id`..."
    
    const schemaPath = path.join(__dirname, 'openapi_schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const relations = [];
    
    Object.keys(schema.definitions).forEach(tableName => {
      const def = schema.definitions[tableName];
      if (def.properties) {
        Object.keys(def.properties).forEach(colName => {
          const prop = def.properties[colName];
          const desc = prop.description || '';
          if (desc.includes('Foreign Key')) {
            // Parse description to extract table and column
            // Format: "Note:\nThis is a Foreign Key to `table.column`..."
            const match = desc.match(/Foreign Key to `([^`]+)`/);
            if (match) {
              const target = match[1];
              const parts = target.split('.');
              relations.push({
                sourceTable: tableName,
                sourceColumn: colName,
                targetTable: parts[0],
                targetColumn: parts[1] || 'id'
              });
            }
          }
        });
      }
    });

    console.log(`Found ${relations.length} foreign key relationships in schema:`);
    console.log(relations);
    
    fs.writeFileSync(
      path.join(__dirname, 'schema_foreign_keys.json'),
      JSON.stringify(relations, null, 2)
    );
  } catch (err) {
    console.error('Error parsing foreign keys:', err);
  }
}

run();
