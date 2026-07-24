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

async function run() {
  try {
    console.log('Fetching REST API OpenAPI Schema...');
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch schema: ${res.statusText}`);
    }

    const schema = await res.json();
    
    // Save full JSON to a file
    const outputPath = path.join(__dirname, 'openapi_schema.json');
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    console.log(`OpenAPI Schema saved to ${outputPath}`);
    
    // Print all tables/definitions found
    const definitions = Object.keys(schema.definitions || {});
    console.log(`\nFound ${definitions.length} tables/definitions:`);
    console.log(definitions.join(', '));
  } catch (err) {
    console.error('Error fetching OpenAPI Schema:', err);
  }
}

run();
