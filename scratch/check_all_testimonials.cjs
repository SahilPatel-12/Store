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
  const { data, error } = await supabase
    .from('website_pooja_products')
    .select('id, name, testimonials');

  if (error) {
    console.error(error);
  } else {
    for (const item of data) {
      if (item.testimonials && item.testimonials.length > 0) {
        console.log(`Product: ${item.name} (${item.id})`);
        console.log(JSON.stringify(item.testimonials, null, 2));
        console.log('---');
      }
    }
  }
}
run();
