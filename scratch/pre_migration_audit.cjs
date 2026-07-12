const fs = require('fs');
const path = require('path');

const HINDI_JSON_PATH = path.join(__dirname, 'shop_product_hindi_translations.json');
const ENGLISH_JSON_PATH = path.join(__dirname, '../shop_product_english_source_for_hindi.json');
const REPORT_OUTPUT_PATH = path.join(__dirname, 'audit_checks_output.json');

function run() {
  const hindiRaw = fs.readFileSync(HINDI_JSON_PATH, 'utf8');
  const englishRaw = fs.readFileSync(ENGLISH_JSON_PATH, 'utf8');

  const hindiProducts = JSON.parse(hindiRaw);
  const englishData = JSON.parse(englishRaw);
  const englishProducts = englishData.products;

  const result = {
    identity: {},
    structural: { mismatches: [] },
    non_translatable: { uuid_changes: [], url_changes: [], rating_changes: [], boolean_changes: [], other_changes: [] },
    leakage: { awareness_count: 0, capitalized_awareness_count: 0, case_insensitive_awareness_count: 0, suspicious: [] },
    matrix: []
  };

  // Task 3: Identity Coverage
  const englishIds = englishProducts.map(p => p.id);
  const hindiIds = hindiProducts.map(p => p.id);
  const uniqueEnglish = [...new Set(englishIds)];
  const uniqueHindi = [...new Set(hindiIds)];

  const matched = [];
  const missing = [];
  const extra = [];
  const duplicates = [];
  const invalidUuids = [];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  hindiProducts.forEach(p => {
    if (!uuidRegex.test(p.id)) {
      invalidUuids.push(p.id);
    }
  });

  englishProducts.forEach(ep => {
    const hp = hindiProducts.find(h => h.id === ep.id);
    if (hp) {
      matched.push(ep.id);
      result.matrix.push({
        num: result.matrix.length + 1,
        id: ep.id,
        en_name: ep.name,
        hi_name: hp.name,
        match: 'YES'
      });
    } else {
      missing.push(ep.id);
      result.matrix.push({
        num: result.matrix.length + 1,
        id: ep.id,
        en_name: ep.name,
        hi_name: 'MISSING',
        match: 'NO'
      });
    }
  });

  hindiProducts.forEach(hp => {
    if (!englishIds.includes(hp.id)) {
      extra.push(hp.id);
    }
    const count = hindiIds.filter(id => id === hp.id).length;
    if (count > 1 && !duplicates.includes(hp.id)) {
      duplicates.push(hp.id);
    }
  });

  result.identity = {
    english_count: englishProducts.length,
    hindi_count: hindiProducts.length,
    unique_english_count: uniqueEnglish.length,
    unique_hindi_count: uniqueHindi.length,
    matched_count: matched.length,
    missing_count: missing.length,
    extra_count: extra.length,
    duplicate_count: duplicates.length,
    invalid_uuid_count: invalidUuids.length,
    coverage_percentage: (matched.length / englishProducts.length) * 100
  };

  // Task 4 & 5: Structural Parity & Non-Translatable Values
  const fieldsToCheck = [
    'id', 'name', 'sanskrit_name', 'short_name', 'category', 'tags', 'subtitle',
    'short_description', 'description', 'spiritual_significance', 'benefits',
    'rituals_included', 'samagri_list', 'priest_details', 'duration', 'ideal_occasions',
    'temple_association', 'who_should_perform', 'offers', 'badges', 'testimonials',
    'faqs', 'booking_instructions', 'cta_labels', 'seo_title', 'seo_description',
    'og_data', 'image_alt', 'image_caption', 'gallery_images', 'certificates',
    'material', 'weight', 'dimensions', 'origin'
  ];

  englishProducts.forEach(ep => {
    const hp = hindiProducts.find(h => h.id === ep.id);
    if (!hp) return;

    // Check key parity
    fieldsToCheck.forEach(f => {
      if (!(f in hp)) {
        result.structural.mismatches.push({
          id: ep.id,
          name: ep.name,
          issue: `Missing field "${f}" in Hindi`
        });
        return;
      }

      // Check type compatibility
      const epType = ep[f] === null ? 'null' : (Array.isArray(ep[f]) ? 'array' : typeof ep[f]);
      const hpType = hp[f] === null ? 'null' : (Array.isArray(hp[f]) ? 'array' : typeof hp[f]);

      if (epType !== hpType && epType !== 'null' && hpType !== 'null') {
        result.structural.mismatches.push({
          id: ep.id,
          name: ep.name,
          issue: `Type mismatch for field "${f}": English is "${epType}", Hindi is "${hpType}"`
        });
      }

      // Verify specific structure preservation
      if (epType === 'array' && hpType === 'array' && ep[f] && hp[f]) {
        if (ep[f].length !== hp[f].length && f !== 'benefits' && f !== 'tags' && f !== 'ideal_occasions' && f !== 'offers' && f !== 'badges') {
          result.structural.mismatches.push({
            id: ep.id,
            name: ep.name,
            issue: `Array length mismatch for field "${f}": English has ${ep[f].length}, Hindi has ${hp[f].length}`
          });
        }
      }

      // Task 5: Non-translatables integrity
      if (f === 'id') {
        if (ep.id !== hp.id) {
          result.non_translatable.uuid_changes.push({ id: ep.id, name: ep.name, en: ep.id, hi: hp.id });
        }
      }
      
      // Compare URLs, ratings, booleans
      if (f === 'gallery_images' && ep.gallery_images && hp.gallery_images) {
        ep.gallery_images.forEach((img, idx) => {
          const hImg = hp.gallery_images[idx];
          if (hImg && img.url !== hImg.url) {
            result.non_translatable.url_changes.push({
              id: ep.id,
              name: ep.name,
              path: `gallery_images[${idx}].url`,
              en: img.url,
              hi: hImg.url
            });
          }
        });
      }

      if (f === 'certificates' && ep.certificates && hp.certificates) {
        ep.certificates.forEach((cert, idx) => {
          const hCert = hp.certificates[idx];
          if (hCert && cert.url !== hCert.url) {
            result.non_translatable.url_changes.push({
              id: ep.id,
              name: ep.name,
              path: `certificates[${idx}].url`,
              en: cert.url,
              hi: hCert.url
            });
          }
        });
      }
    });
  });

  // Task 7: English Leakage
  const rawText = hindiRaw;
  result.leakage.awareness_count = (rawText.match(/awareness/g) || []).length;
  result.leakage.capitalized_awareness_count = (rawText.match(/Awareness/g) || []).length;
  result.leakage.case_insensitive_awareness_count = (rawText.match(/awareness/gi) || []).length;

  // Scan all string fields for Latin characters (excluding URLs, UUIDs, certificates url, icons, etc.)
  const latinRegex = /[a-zA-Z]/;
  const isUrl = (val) => typeof val === 'string' && (val.startsWith('http') || val.startsWith('https://') || val.startsWith('📜') || val === '📿');
  const isUuid = (val) => typeof val === 'string' && uuidRegex.test(val);

  hindiProducts.forEach(p => {
    Object.keys(p).forEach(k => {
      const val = p[k];
      if (typeof val === 'string' && !isUrl(val) && !isUuid(val) && k !== 'duration' && k !== 'weight' && k !== 'dimensions' && k !== 'origin') {
        if (latinRegex.test(val)) {
          // Exclude allowed words or codes (like certificates url "📜" or emoji strings or English letters inside quotes)
          // Clean the string from markdown links and URLs
          const cleaned = val.replace(/https?:\/\/[^\s]+/g, '').replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '');
          if (latinRegex.test(cleaned)) {
            result.leakage.suspicious.push({
              id: p.id,
              name: p.name,
              field: k,
              value: val
            });
          }
        }
      }
    });
  });

  fs.writeFileSync(REPORT_OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`Saved pre-migration checks output to ${REPORT_OUTPUT_PATH}`);
}

run();
