const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    // 1. Fetch the original product row from website_pooja_products
    console.log('Fetching original product from website_pooja_products...');
    const { data: originalProduct, error: fetchErr } = await supabase
      .from('website_pooja_products')
      .select('*')
      .eq('slug', 'vidya-rudraksh')
      .single();

    if (fetchErr) throw fetchErr;

    // Delete existing duplicate with same slug if any exists to avoid duplicate constraint errors
    console.log('Deleting any existing product with slug vidya-rudraksh-1001...');
    await supabase
      .from('website_pooja_products')
      .delete()
      .eq('slug', 'vidya-rudraksh-1001');

    const newProductId = crypto.randomUUID();
    const clonedProduct = {
      ...originalProduct,
      id: newProductId,
      name: 'Vidya Rudraksh Premium',
      slug: 'vidya-rudraksh-1001',
      price: 1001,
      original_price: 1999, // higher crossed price for premium
      delivery_override_enabled: true,
      custom_delivery: 0,
      gst_override_enabled: true,
      custom_gst: 0,
      related_products: [
        'e3af2e49-7fc7-4bd5-89ec-ed861641c799', // 2 Mukhi Rudraksha (1501)
        '9bab7781-f55f-4847-8361-692d00daf1ed', // 7 Mukhi Rudraksha (999)
        '96175523-5182-43c9-a7fc-6abf7f96858c'  // 3 Mukhi Rudraksha (1201)
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting cloned product...');
    const { error: insertErr } = await supabase
      .from('website_pooja_products')
      .insert(clonedProduct);

    if (insertErr) throw insertErr;
    console.log('Cloned product inserted successfully! ID:', newProductId);

    // 2. Fetch original translations
    console.log('Fetching translations for original product...');
    const { data: originalTranslations, error: transErr } = await supabase
      .from('website_pooja_product_translations')
      .select('*')
      .eq('product_id', originalProduct.id);

    if (transErr) throw transErr;

    // Insert cloned translations
    for (const t of originalTranslations) {
      const clonedTrans = {
        ...t,
        id: crypto.randomUUID(),
        product_id: newProductId,
        name: t.locale === 'hi' ? 'विद्या रुद्राक्ष प्रीमियम' : 'Vidya Rudraksh Premium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`Inserting cloned translation for locale: ${t.locale}...`);
      const { error: tInsertErr } = await supabase
        .from('website_pooja_product_translations')
        .insert(clonedTrans);

      if (tInsertErr) throw tInsertErr;
    }
    console.log('All translations cloned successfully!');

  } catch (err) {
    console.error('Operation failed:', err);
  }
}

run();
