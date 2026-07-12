const fs = require('fs');
const path = require('path');

// Constants
const contentFilePath = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/19d69d0b-f718-47b2-95eb-9448e6bdec99/.system_generated/steps/287/content.md';
const artifactDir = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/19d69d0b-f718-47b2-95eb-9448e6bdec99';
const outputSourcePath = path.join(artifactDir, 'shop_product_english_source.json');
const outputValidationPath = path.join(__dirname, 'validation_results.json');

function run() {
  console.log('Reading content file...');
  if (!fs.existsSync(contentFilePath)) {
    console.error(`Error: Content file not found at ${contentFilePath}`);
    process.exit(1);
  }

  const contentText = fs.readFileSync(contentFilePath, 'utf8');
  
  // Locate JSON block in content.md
  // The content is saved as a markdown file, the JSON array starts with [{"id":...
  const jsonStart = contentText.indexOf('[{"id":');
  if (jsonStart === -1) {
    console.error('Error: Could not locate JSON array starting with [{"id": in the content file.');
    process.exit(1);
  }

  // Extract the JSON string
  const jsonText = contentText.substring(jsonStart).trim();
  
  let products;
  try {
    products = JSON.parse(jsonText);
  } catch (e) {
    console.error('Error parsing JSON from file:', e.message);
    process.exit(1);
  }

  const count = products.length;
  console.log(`Successfully parsed ${count} products from database dump.`);

  // Task 4: JSON Structure Auditing
  const jsonFields = [
    'rituals_included',
    'samagri_list',
    'priest_details',
    'testimonials',
    'faqs',
    'cta_labels',
    'og_data',
    'gallery_images',
    'certificates'
  ];

  const auditReport = {
    total_products: count,
    fields: {}
  };

  jsonFields.forEach(field => {
    auditReport.fields[field] = {
      type_distribution: {},
      unique_shapes: [],
      missing_keys: {},
      additional_keys: {},
      null_count: 0,
      empty_container_count: 0, // e.g. [] or {}
      exceptional_products: []
    };
  });

  const cleanedProducts = [];

  products.forEach(p => {
    const productCleaned = {
      product_id: p.id,
      name: p.name,
      sanskrit_name: p.sanskrit_name || null,
      short_name: p.short_name || null,
      category: p.category || null,
      tags: p.tags || [],
      subtitle: p.subtitle || null,
      short_description: p.short_description || null,
      description: p.description,
      spiritual_significance: p.spiritual_significance || null,
      benefits: p.benefits || [],
      rituals_included: p.rituals_included || [],
      samagri_list: p.samagri_list || [],
      priest_details: p.priest_details || null,
      duration: p.duration || null,
      ideal_occasions: p.ideal_occasions || [],
      temple_association: p.temple_association || null,
      who_should_perform: p.who_should_perform || null,
      offers: p.offers || [],
      badges: p.badges || [],
      testimonials: p.testimonials || [],
      faqs: p.faqs || [],
      booking_instructions: p.booking_instructions || null,
      cta_labels: p.cta_labels || null,
      seo_title: p.seo_title || null,
      seo_description: p.seo_description || null,
      og_data: p.og_data || null,
      image_alt: p.image_alt || null,
      image_caption: p.image_caption || null,
      gallery_images: p.gallery_images || [],
      certificates: p.certificates || [],
      material: p.material || null,
      weight: p.weight || null,
      dimensions: p.dimensions || null,
      origin: p.origin || null
    };

    cleanedProducts.push(productCleaned);

    // Audit JSONB fields for this product
    jsonFields.forEach(field => {
      const val = p[field];
      const fieldAudit = auditReport.fields[field];

      if (val === null || val === undefined) {
        fieldAudit.null_count++;
        return;
      }

      const type = Array.isArray(val) ? 'array' : typeof val;
      fieldAudit.type_distribution[type] = (fieldAudit.type_distribution[type] || 0) + 1;

      if (type === 'array') {
        if (val.length === 0) {
          fieldAudit.empty_container_count++;
          return;
        }

        // Get key sets for each object inside array
        val.forEach((item, index) => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            const keys = Object.keys(item).sort().join(',');
            if (!fieldAudit.unique_shapes.includes(keys)) {
              fieldAudit.unique_shapes.push(keys);
            }

            // Check keys for specific expected structures
            if (field === 'rituals_included') {
              const expected = ['name', 'description', 'duration'];
              expected.forEach(k => {
                if (!(k in item)) {
                  fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
                  fieldAudit.exceptional_products.push(`${p.name} (Missing ritual key: ${k})`);
                }
              });
            } else if (field === 'samagri_list') {
              const expected = ['name', 'quantity', 'description'];
              expected.forEach(k => {
                if (!(k in item)) {
                  fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
                }
              });
            } else if (field === 'testimonials') {
              const expected = ['name', 'rating', 'comment', 'location'];
              expected.forEach(k => {
                if (!(k in item)) {
                  fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
                }
              });
            } else if (field === 'faqs') {
              const expected = ['question', 'answer'];
              expected.forEach(k => {
                if (!(k in item)) {
                  fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
                }
              });
            } else if (field === 'gallery_images') {
              const expected = ['alt', 'url'];
              expected.forEach(k => {
                if (!(k in item)) {
                  fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
                }
              });
            } else if (field === 'certificates') {
              const expected = ['name', 'issuer', 'url'];
              expected.forEach(k => {
                if (!(k in item)) {
                  fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
                }
              });
            }
          } else {
            fieldAudit.exceptional_products.push(`${p.name} (Non-object array element at index ${index})`);
          }
        });

      } else if (type === 'object') {
        const keys = Object.keys(val).sort().join(',');
        if (keys === '') {
          fieldAudit.empty_container_count++;
          return;
        }

        if (!fieldAudit.unique_shapes.includes(keys)) {
          fieldAudit.unique_shapes.push(keys);
        }

        // Check key structure
        if (field === 'priest_details') {
          const expected = ['name', 'experience', 'qualification', 'bio'];
          expected.forEach(k => {
            if (!(k in val)) {
              fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
              fieldAudit.exceptional_products.push(`${p.name} (Missing priest key: ${k})`);
            }
          });
        } else if (field === 'cta_labels') {
          const expected = ['primary', 'secondary'];
          expected.forEach(k => {
            if (!(k in val)) {
              fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
            }
          });
        } else if (field === 'og_data') {
          const expected = ['title', 'description', 'image'];
          expected.forEach(k => {
            if (!(k in val)) {
              fieldAudit.missing_keys[k] = (fieldAudit.missing_keys[k] || 0) + 1;
            }
          });
        }
      } else {
        fieldAudit.exceptional_products.push(`${p.name} (Unexpected type: ${type})`);
      }
    });
  });

  // Task 5: Generate Translation Source JSON
  const finalJson = {
    schema_version: 1,
    locale: "en",
    product_count: count,
    products: cleanedProducts
  };

  fs.writeFileSync(outputSourcePath, JSON.stringify(finalJson, null, 2));
  fs.writeFileSync(outputValidationPath, JSON.stringify(auditReport, null, 2));

  console.log('\n=======================================');
  console.log('  EXTRACTION & VALIDATION COMPLETED    ');
  console.log('=======================================');
  console.log(`Live Product Count: ${count}`);
  console.log(`Saved English Source: ${outputSourcePath}`);
  console.log(`Saved Schema Validation: ${outputValidationPath}`);
  console.log('\n--- Key JSONB Audit Findings ---');
  jsonFields.forEach(field => {
    const f = auditReport.fields[field];
    console.log(`\nField [${field}]:`);
    console.log(`  Null Count: ${f.null_count}`);
    console.log(`  Empty Containers: ${f.empty_container_count}`);
    console.log(`  Unique Key Shapes: ${JSON.stringify(f.unique_shapes)}`);
    if (Object.keys(f.missing_keys).length > 0) {
      console.log(`  Missing Expected Keys: ${JSON.stringify(f.missing_keys)}`);
    }
    if (f.exceptional_products.length > 0) {
      const uniqueExceptional = [...new Set(f.exceptional_products)];
      console.log(`  Exceptional Products (first 3): ${JSON.stringify(uniqueExceptional.slice(0, 3))}`);
    }
  });
}

run();
