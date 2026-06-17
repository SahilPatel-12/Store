const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    console.log('--- Checking website_settings ---');
    const { data: wsData, error: wsError } = await supabase
      .from('website_settings')
      .select('*')
      .eq('key', 'whatsapp_settings')
      .maybeSingle();

    if (wsError) console.error('Error fetching website_settings:', wsError);
    else console.log('website_settings (whatsapp_settings):', wsData);

    console.log('\n--- Checking api_configs via RPC get_api_configs ---');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_api_configs');
    if (rpcError) console.error('Error calling get_api_configs:', rpcError);
    else console.log('RPC get_api_configs output:', rpcData);

    console.log('\n--- Direct query on api_configs table ---');
    const { data: tblData, error: tblError } = await supabase
      .from('api_configs')
      .select('*');
    if (tblError) console.error('Error querying api_configs table directly:', tblError);
    else console.log('Direct api_configs table content:', tblData);

  } catch (err) {
    console.error('Exception:', err);
  }
}

check();
