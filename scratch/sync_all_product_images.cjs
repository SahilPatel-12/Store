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
  console.log('Fetching all pooja products to check image sync...');
  const { data, error } = await supabase
    .from('website_pooja_products')
    .select('id, name, image, gallery_images');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  let updateCount = 0;
  for (const item of data) {
    if (item.gallery_images && Array.isArray(item.gallery_images) && item.gallery_images.length > 0) {
      const firstGalleryUrl = item.gallery_images[0].url;
      if (item.image !== firstGalleryUrl) {
        console.log(`Mismatch found for "${item.name}":`);
        console.log(`  Current image:  ${item.image}`);
        console.log(`  Gallery image0: ${firstGalleryUrl}`);
        
        const { error: updateError } = await supabase
          .from('website_pooja_products')
          .update({ image: firstGalleryUrl })
          .eq('id', item.id);

        if (updateError) {
          console.error(`  Failed to update "${item.name}":`, updateError);
        } else {
          console.log(`  Successfully updated primary image URL!`);
          updateCount++;
        }
      }
    }
  }

  console.log(`Finished syncing images! Total products updated: ${updateCount}`);
}

run();
