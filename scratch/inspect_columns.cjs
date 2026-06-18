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

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']);

async function run() {
  try {
    console.log('--- website_pooja_products sample ---');
    const { data: pData, error: pError } = await supabase
      .from('website_pooja_products')
      .select('*')
      .limit(1);
    if (pError) console.error(pError);
    else if (pData.length > 0) console.log(Object.keys(pData[0]));
    else console.log('No products found');

    console.log('\n--- website_store_orders sample ---');
    const { data: oData, error: oError } = await supabase
      .from('website_store_orders')
      .select('*')
      .limit(1);
    if (oError) console.error(oError);
    else if (oData.length > 0) console.log(Object.keys(oData[0]));
    else console.log('No orders found');

  } catch (err) {
    console.error(err);
  }
}

run();
