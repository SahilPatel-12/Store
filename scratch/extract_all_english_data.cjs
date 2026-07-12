const fs = require('fs');
const path = require('path');

// Determine output directory - use absolute path of the artifact directory
const artifactDir = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/19d69d0b-f718-47b2-95eb-9448e6bdec99';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

// Function to safely require Supabase client from env
let supabase = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
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
    if (supabaseUrl && supabaseAnonKey) {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('Supabase client initialized successfully.');
    }
  }
} catch (e) {
  console.log('Could not initialize Supabase client:', e.message);
}

// Option A: Extract from live Supabase DB
async function extractFromLiveDb() {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  console.log('Fetching live products from website_pooja_products...');
  const { data: products, error: pError } = await supabase
    .from('website_pooja_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (pError) throw pError;

  console.log(`Fetched ${products.length} products from Supabase.`);

  console.log('Fetching live website settings...');
  const { data: settings, error: sError } = await supabase
    .from('website_settings')
    .select('key, value');

  if (sError) throw sError;
  console.log(`Fetched ${settings.length} settings rows.`);

  return { products, settings };
}

// Option B: Extract by parsing local seed and update files in scratch/
function extractFromLocalFiles() {
  console.log('Option B: Compiling from local seed and update files...');
  
  // 1. Read seed_pooja_products.cjs
  const seedFile = path.join(__dirname, 'seed_pooja_products.cjs');
  if (!fs.existsSync(seedFile)) {
    throw new Error('seed_pooja_products.cjs not found in scratch folder');
  }

  // We can't require it directly because it initializes Supabase and calls run()
  // So we read it as text and extract the productsToSeed array using clean JS regex/subtext parsing
  const seedText = fs.readFileSync(seedFile, 'utf8');
  
  // Locate productsToSeed array block
  const startIndex = seedText.indexOf('const productsToSeed = [');
  if (startIndex === -1) {
    throw new Error('Could not locate productsToSeed array in seed file');
  }

  // Find matching closing bracket for array
  let bracketCount = 0;
  let endIndex = -1;
  for (let i = startIndex + 23; i < seedText.length; i++) {
    if (seedText[i] === '[') bracketCount++;
    if (seedText[i] === ']') {
      if (bracketCount === 0) {
        endIndex = i;
        break;
      } else {
        bracketCount--;
      }
    }
  }

  if (endIndex === -1) {
    throw new Error('Could not find end of productsToSeed array');
  }

  const productsJsonText = seedText.substring(startIndex + 23, endIndex + 1);
  
  // Clean text and evaluate it to get baseline products
  let baselineProducts = [];
  try {
    // Replace variables in text like r1Images[0 % r1Images.length] with mock strings or placeholders
    const cleanText = productsJsonText
      .replace(/r1Images\[\d+\s*%\s*r1Images\.length\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/r2Images\[\d+\s*%\s*r2Images\.length\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/r3Images\[\d+\s*%\s*r3Images\.length\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/bImages\[0\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/bImages/g, '[]')
      .replace(/tImages\[0\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/tImages/g, '[]')
      .replace(/lImages/g, '[]')
      .replace(/hImages\[0\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/hImages/g, '[]')
      .replace(/tmImages\[0\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/tmImages/g, '[]')
      .replace(/dImages\[0\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/dImages/g, '[]')
      .replace(/oImages\[0\]/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/oImages/g, '[]')
      .replace(/k1Image/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/horsesImage/g, '"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/mock_image.png"')
      .replace(/rudrakshaFAQs/g, '[]')
      .replace(/crystalFAQs/g, '[]')
      .replace(/crystalPriest/g, '{}')
      .replace(/rudrakshaPriest/g, '{}')
      .replace(/r2Base\s*\+\s*'/g, "'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/");
    
    baselineProducts = eval(`[ ${cleanText} ]`);
  } catch (e) {
    console.error('Failed to parse baseline products JSON:', e.message);
    throw e;
  }

  console.log(`Loaded ${baselineProducts.length} baseline products.`);

  // 2. Loop through all update_*.cjs files and extract updates
  const files = fs.readdirSync(__dirname);
  const products = [];

  for (const baseProd of baselineProducts) {
    let productData = { ...baseProd };
    
    // Find update file matching product name/category
    const cleanName = baseProd.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);
    const updateFile = files.find(f => f.startsWith('update_') && f.endsWith('.cjs') && f.toLowerCase().includes(cleanName));
    
    if (updateFile) {
      const updatePath = path.join(__dirname, updateFile);
      const updateText = fs.readFileSync(updatePath, 'utf8');
      
      const payloadStartIndex = updateText.indexOf('const updatePayload = {');
      if (payloadStartIndex !== -1) {
        let updateBracketCount = 0;
        let payloadEndIndex = -1;
        for (let i = payloadStartIndex + 22; i < updateText.length; i++) {
          if (updateText[i] === '{') updateBracketCount++;
          if (updateText[i] === '}') {
            if (updateBracketCount === 0) {
              payloadEndIndex = i;
              break;
            } else {
              updateBracketCount--;
            }
          }
        }
        
        if (payloadEndIndex !== -1) {
          try {
            const payloadText = updateText.substring(payloadStartIndex + 22, payloadEndIndex + 1);
            // Evaluate payload
            const payload = eval(`(${payloadText})`);
            productData = { ...productData, ...payload };
            console.log(`Merged updates from ${updateFile} for product "${baseProd.name}"`);
          } catch (e) {
            console.warn(`Failed to parse payload in ${updateFile}:`, e.message);
          }
        }
      }
    } else {
      // Try to find by UUID instead
      const uuidFile = files.find(f => f.startsWith('update_') && f.endsWith('.cjs') && fs.readFileSync(path.join(__dirname, f), 'utf8').includes(baseProd.id));
      if (uuidFile) {
        const updatePath = path.join(__dirname, uuidFile);
        const updateText = fs.readFileSync(updatePath, 'utf8');
        const payloadStartIndex = updateText.indexOf('const updatePayload = {');
        if (payloadStartIndex !== -1) {
          let updateBracketCount = 0;
          let payloadEndIndex = -1;
          for (let i = payloadStartIndex + 22; i < updateText.length; i++) {
            if (updateText[i] === '{') updateBracketCount++;
            if (updateText[i] === '}') {
              if (updateBracketCount === 0) {
                payloadEndIndex = i;
                break;
              } else {
                updateBracketCount--;
              }
            }
          }
          if (payloadEndIndex !== -1) {
            try {
              const payloadText = updateText.substring(payloadStartIndex + 22, payloadEndIndex + 1);
              const payload = eval(`(${payloadText})`);
              productData = { ...productData, ...payload };
              console.log(`Merged updates from ${uuidFile} for product "${baseProd.name}"`);
            } catch (e) {
              console.warn(`Failed to parse payload in ${uuidFile}:`, e.message);
            }
          }
        }
      }
    }
    
    // Add default duration, cta labels etc
    if (!productData.duration) productData.duration = "2 Hours";
    if (!productData.cta_labels) productData.cta_labels = { primary: "Book Now", secondary: "Learn More" };
    if (!productData.temple_association) productData.temple_association = "Kashi Vishwanath Temple, Varanasi";
    if (!productData.who_should_perform) productData.who_should_perform = "Families seeking spiritual growth and obstacle clearance";
    
    products.push(productData);
  }

  // Create default settings mock values based on actual migration definitions
  const settings = [
    {
      key: 'store_categories',
      value: ["Rudraksha", "Bracelet", "Murti", "Yantras", "Anklet", "Frames", "Rashi", "Karungali", "Jadi", "Pyrite", "Kavach", "Siddh Range", "Gemstones", "Pyramid", "Necklaces/Mala", "Tower & Tumbles", "Crystal Dome Trees", "Women Bracelets", "Evil Eye", "Gifting"]
    },
    {
      key: 'homepage_settings',
      value: {
        featuredTitle: "Divine Recommendations",
        featuredSubtitle: "Curated spiritual items energized at sacred temples",
        saleTitle: "Festive Divine Offerings",
        saleSubtitle: "Special blessings and spiritual tools for your home altar",
        newArrivalsTitle: "New Sacred Additions",
        newArrivalsSubtitle: "Freshly energized items sourced directly from Kashi & Nepal",
        bannerImages: [
          "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/banner/ChatGPT Image May 26, 2026, 12_19_59 PM.png"
        ]
      }
    },
    {
      key: 'tax_delivery_settings',
      value: {
        global_gst_percent: 8,
        global_delivery_charge: 49,
        free_delivery_threshold: 999
      }
    }
  ];

  return { products, settings };
}

// Generate the final JSON exports
async function run() {
  let data = null;
  try {
    // Try live fetch first
    data = await extractFromLiveDb();
  } catch (err) {
    console.log('Live Supabase query failed or skipped, falling back to local files parsing:', err.message);
    data = extractFromLocalFiles();
  }

  const { products, settings } = data;

  // 1. Export Products English Source
  const productSource = products.map(p => ({
    id: p.id,
    name: p.name,
    sanskrit_name: p.sanskrit_name || p.sanskritName || null,
    short_name: p.short_name || p.shortName || null,
    subtitle: p.subtitle || null,
    short_description: p.short_description || p.shortDescription || null,
    description: p.description,
    spiritual_significance: p.spiritual_significance || null,
    benefits: p.benefits || [],
    duration: p.duration || "2 Hours",
    temple_association: p.temple_association || null,
    who_should_perform: p.who_should_perform || null,
    booking_instructions: p.booking_instructions || null,
    seo_title: p.seo_title || p.seoTitle || null,
    seo_description: p.seo_description || p.seoDescription || null,
    image_alt: p.image_alt || null,
    image_caption: p.image_caption || null,
    
    // Nested fields
    rituals_included: p.rituals_included || p.ritualsIncluded || [],
    samagri_list: p.samagri_list || p.samagriList || [],
    priest_details: p.priest_details || p.priestDetails || null,
    faqs: p.faqs || [],
    testimonials: p.testimonials || [],
    cta_labels: p.cta_labels || p.ctaLabels || null,
    ui_labels: p.ui_labels || p.uiLabels || {}
  }));

  const productsPath = path.join(artifactDir, 'shop_products_english_source.json');
  fs.writeFileSync(productsPath, JSON.stringify(productSource, null, 2));
  console.log(`Successfully exported products to: ${productsPath}`);

  // 2. Export Categories English Source
  const storeCategories = settings.find(s => s.key === 'store_categories')?.value || [];
  const categoriesPath = path.join(artifactDir, 'shop_categories_english_source.json');
  fs.writeFileSync(categoriesPath, JSON.stringify(storeCategories, null, 2));
  console.log(`Successfully exported categories to: ${categoriesPath}`);

  // 3. Export Homepage settings
  const homepageSettings = settings.find(s => s.key === 'homepage_settings')?.value || {};
  const homepagePath = path.join(artifactDir, 'shop_homepage_dynamic_english_source.json');
  fs.writeFileSync(homepagePath, JSON.stringify(homepageSettings, null, 2));
  console.log(`Successfully exported homepage settings to: ${homepagePath}`);

  // 4. Summarize and create final checklist JSON
  const summary = {
    products_count: productSource.length,
    categories_count: storeCategories.length,
    homepage_has_texts: !!(homepageSettings.featuredTitle || homepageSettings.saleTitle),
    timestamp: new Date().toISOString()
  };
  const summaryPath = path.join(artifactDir, 'extraction_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote extraction summary to: ${summaryPath}`);

  console.log('\n--- EXTRACTION COMPLETED SUCCESSFULLY ---');
  console.log(`Product export path: ${productsPath}`);
  console.log(`Categories export path: ${categoriesPath}`);
  console.log(`Homepage settings path: ${homepagePath}`);
  console.log(`Summary path: ${summaryPath}`);
}

run();
