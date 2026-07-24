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
    console.log('Fetching all pooja products...');
    const { data: products, error } = await supabase
      .from('website_pooja_products')
      .select('id, name, slug, price, original_price, is_published, in_stock, category, commission_percent, gst_override_enabled, custom_gst, delivery_override_enabled, custom_delivery');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    console.log(`Total products: ${products.length}`);
    
    // Check duplicates by Slug
    const slugMap = {};
    const nameMap = {};
    const idMap = {};
    
    const duplicates = {
      slugs: [],
      names: [],
      ids: []
    };

    products.forEach(p => {
      // ID check
      if (idMap[p.id]) {
        duplicates.ids.push(p);
      } else {
        idMap[p.id] = p;
      }
      
      // Slug check
      if (p.slug) {
        if (slugMap[p.slug]) {
          duplicates.slugs.push({ existing: slugMap[p.slug], duplicate: p });
        } else {
          slugMap[p.slug] = p;
        }
      }
      
      // Name check
      if (p.name) {
        const normName = p.name.trim().toLowerCase();
        if (nameMap[normName]) {
          duplicates.names.push({ existing: nameMap[normName], duplicate: p });
        } else {
          nameMap[normName] = p;
        }
      }
    });

    console.log('\n=== PRODUCT DUPLICATION REPORT ===');
    console.log(`Duplicate IDs: ${duplicates.ids.length}`);
    console.log(`Duplicate Slugs: ${duplicates.slugs.length}`);
    duplicates.slugs.forEach(d => {
      console.log(`- Slug "${d.duplicate.slug}":\n  * ID ${d.existing.id} | Name: "${d.existing.name}"\n  * ID ${d.duplicate.id} | Name: "${d.duplicate.name}"`);
    });
    
    console.log(`Duplicate Names: ${duplicates.names.length}`);
    duplicates.names.forEach(d => {
      console.log(`- Name "${d.duplicate.name}":\n  * ID ${d.existing.id} | Slug: "${d.existing.slug}"\n  * ID ${d.duplicate.id} | Slug: "${d.duplicate.slug}"`);
    });

    fs.writeFileSync(
      path.join(__dirname, 'product_audit_results.json'),
      JSON.stringify({ total: products.length, products, duplicates }, null, 2)
    );
    console.log('\nProduct audit results saved to product_audit_results.json');

  } catch (err) {
    console.error('Exception during product audit:', err);
  }
}

run();
