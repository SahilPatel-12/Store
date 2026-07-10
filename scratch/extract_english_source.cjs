const fs = require('fs');
const path = require('path');

// Target directory in the workspace or artifact directory
const artifactDir = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/19d69d0b-f718-47b2-95eb-9448e6bdec99';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

// Function to extract from local seed and update files in scratch/
function extractFromLocalFiles() {
  console.log('Extracting English source catalog from local scratch scripts...');
  
  // 1. Read seed_pooja_products.cjs
  const seedFile = path.join(__dirname, 'seed_pooja_products.cjs');
  if (!fs.existsSync(seedFile)) {
    throw new Error('seed_pooja_products.cjs not found in scratch folder');
  }

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
    console.error('Failed to parse baseline products:', e.message);
    throw e;
  }

  const files = fs.readdirSync(__dirname);
  const products = [];

  for (const baseProd of baselineProducts) {
    let productData = { ...baseProd };
    
    // Find update file
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
            const payload = eval(`(${payloadText})`);
            productData = { ...productData, ...payload };
          } catch (e) {
            console.warn(`Failed to parse payload in ${updateFile}:`, e.message);
          }
        }
      }
    } else {
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
            } catch (e) {
              console.warn(`Failed to parse payload in ${uuidFile}:`, e.message);
            }
          }
        }
      }
    }
    
    // Add default values for missing keys
    if (!productData.duration) productData.duration = "2 Hours";
    if (!productData.cta_labels) productData.cta_labels = { primary: "Book Now", secondary: "Learn More" };
    if (!productData.temple_association) productData.temple_association = "Kashi Vishwanath Temple, Varanasi";
    if (!productData.who_should_perform) productData.who_should_perform = "Families seeking spiritual growth and obstacle clearance";
    
    products.push(productData);
  }

  // Format exactly as requested
  return products.map(p => ({
    product_id: p.id,
    locale: "en",
    name: p.name,
    sanskrit_name: p.sanskritName || p.sanskrit_name || null,
    short_name: p.short_name || null,
    subtitle: p.subtitle || null,
    short_description: p.short_description || null,
    description: p.description,
    spiritual_significance: p.spiritual_significance || null,
    benefits: p.benefits || [],
    rituals_included: p.rituals_included || p.ritualsIncluded || [],
    samagri_list: p.samagri_list || p.samagriList || [],
    priest_details: p.priest_details || p.priestDetails || null,
    duration: p.duration || null,
    ideal_occasions: p.ideal_occasions || p.idealOccasions || [],
    temple_association: p.temple_association || null,
    who_should_perform: p.who_should_perform || null,
    offers: p.offers || [],
    badges: p.badges || [],
    testimonials: p.testimonials || [],
    faqs: p.faqs || [],
    booking_instructions: p.booking_instructions || null,
    cta_labels: p.cta_labels || p.ctaLabels || null,
    seo_title: p.seo_title || p.seoTitle || null,
    seo_description: p.seo_description || p.seoDescription || null,
    image_alt: p.image_alt || null,
    image_caption: p.image_caption || null,
    material: p.material || null,
    weight: p.weight || null,
    dimensions: p.dimensions || null,
    origin: p.origin || null
  }));
}

// Generate the final JSON file
try {
  const result = extractFromLocalFiles();
  const outputPath = path.join(artifactDir, 'shop_product_english_source.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Successfully exported English product data to: ${outputPath}`);
  console.log(`Total exported products: ${result.length}`);
} catch (err) {
  console.error('Failed to extract products:', err.message);
  process.exit(1);
}
