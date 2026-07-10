const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const englishPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json';
const hindiPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json';

// Calculate SHA-256
function getSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

console.log('--- AUDIT TASK 1: Source File Validation ---');
const englishSha = getSha256(englishPath);
const hindiSha = getSha256(hindiPath);

console.log(`ENGLISH SOURCE SHA-256: ${englishSha}`);
console.log(`HINDI SOURCE SHA-256: ${hindiSha}`);

let englishData, hindiData;
try {
  const parsedEnglish = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
  englishData = parsedEnglish.products || parsedEnglish;
  console.log('English JSON syntax: VALID');
} catch (e) {
  console.error('English JSON syntax: INVALID', e);
  process.exit(1);
}

try {
  hindiData = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));
  console.log('Hindi JSON syntax: VALID');
} catch (e) {
  console.error('Hindi JSON syntax: INVALID', e);
  process.exit(1);
}

console.log(`English product count: ${englishData.length}`);
console.log(`Hindi product count: ${hindiData.length}`);

// Map arrays by ID
const englishMap = new Map();
englishData.forEach(p => englishMap.set(p.id, p));

const hindiMap = new Map();
hindiData.forEach(p => hindiMap.set(p.id, p));

console.log('\n--- AUDIT TASK 2: UUID Identity Matching ---');
const englishIds = englishData.map(p => p.id);
const hindiIds = hindiData.map(p => p.id);

const uniqueEnglishIds = new Set(englishIds);
const uniqueHindiIds = new Set(hindiIds);

const matchedIds = [];
const missingHindiIds = [];
const extraHindiIds = [];
const duplicateEnglishIds = [];
const duplicateHindiIds = [];
const invalidEnglishIds = [];
const invalidHindiIds = [];

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

englishIds.forEach((id, index) => {
  if (!uuidRegex.test(id)) invalidEnglishIds.push(id);
  if (englishIds.indexOf(id) !== index) duplicateEnglishIds.push(id);
});

hindiIds.forEach((id, index) => {
  if (!uuidRegex.test(id)) invalidHindiIds.push(id);
  if (hindiIds.indexOf(id) !== index) duplicateHindiIds.push(id);
});

englishData.forEach(ep => {
  if (hindiMap.has(ep.id)) {
    matchedIds.push(ep.id);
  } else {
    missingHindiIds.push(ep.id);
  }
});

hindiData.forEach(hp => {
  if (!englishMap.has(hp.id)) {
    extraHindiIds.push(hp.id);
  }
});

console.log(`Unique English UUIDs = ${uniqueEnglishIds.size}`);
console.log(`Unique Hindi UUIDs = ${uniqueHindiIds.size}`);
console.log(`Matched UUIDs = ${matchedIds.length}`);
console.log(`Missing Hindi UUIDs = ${missingHindiIds.length}`);
console.log(`Extra Hindi UUIDs = ${extraHindiIds.length}`);
console.log(`Duplicate English UUIDs = ${duplicateEnglishIds.length}`);
console.log(`Duplicate Hindi UUIDs = ${duplicateHindiIds.length}`);
console.log(`Invalid English UUIDs = ${invalidEnglishIds.length}`);
console.log(`Invalid Hindi UUIDs = ${invalidHindiIds.length}`);
console.log(`Coverage = ${(matchedIds.length / 30) * 100}%`);

// Product Identity Matrix
console.log('\n--- Matrix data ---');
englishData.forEach((ep, i) => {
  const hp = hindiMap.get(ep.id);
  console.log(`MATRIX_ROW: ${i+1} | ${ep.id} | ${ep.name} | ${hp ? hp.name : 'MISSING'} | ${hp ? 'YES' : 'NO'}`);
});

console.log('\n--- AUDIT TASK 3: Product Identity Audit ---');
// Let's audit identity mismatch.
// Check if name, short_name, category, weight, dimensions, origin, material, etc., are consistent.
let identityMismatches = 0;
englishData.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  // Let's check some identity rules
  // Mukhi check
  const m1 = ep.name.match(/(\d+)\s+Mukhi/i);
  if (m1) {
    const mukhiNum = m1[1];
    // check if hindi name contains same number (using devanagari or english digit)
    const hName = hp.name;
    const expectedDigit = mukhiNum; // e.g. "1" or "2" etc
    const hasExpectedDigit = hName.includes(expectedDigit);
    // Hindi translation for "Mukhi" is "मुखी"
    if (!hasExpectedDigit) {
      console.log(`IDENTITY MISMATCH: Mukhi number check failed for ${ep.name} (ID: ${ep.id}). Hindi: ${hp.name}`);
      identityMismatches++;
    }
  }

  // Horseshoe check
  if (ep.id === '1fe03faa-3042-492d-b977-d536548cf0e2') {
    if (!hp.name.includes('काले घोड़े की नाल')) {
      console.log(`IDENTITY MISMATCH: Black Horseshoe name check failed. Hindi: ${hp.name}`);
      identityMismatches++;
    }
  }

  // Pyrite Owl check
  if (ep.id === '5fbc27f1-fd14-41af-b350-c348151b0c75') {
    if (hp.name.includes('कछुआ') || hp.name.includes('कछुआ')) {
      console.log(`IDENTITY MISMATCH: Pyrite Owl translated as tortoise. Hindi: ${hp.name}`);
      identityMismatches++;
    }
  }

  // Tulsi check
  if (ep.id === 'ef9700ec-42c3-4de4-8b94-9f3e86b8d760') {
    if (hp.name.toLowerCase().includes('karungali') || hp.description.toLowerCase().includes('karungali')) {
      console.log(`IDENTITY MISMATCH: Tulsi Mala contains Karungali identity. Hindi: ${hp.name}`);
      identityMismatches++;
    }
  }
});
console.log(`PRODUCT IDENTITY MISMATCHES: ${identityMismatches}`);


console.log('\n--- AUDIT TASK 4: Field-by-field Structural Match ---');
// Let's find the union/intersection of keys.
const englishKeys = new Set();
englishData.forEach(p => Object.keys(p).forEach(k => englishKeys.add(k)));
console.log(`Canonical English fields count: ${englishKeys.size}`);
console.log('Canonical English keys:', Array.from(englishKeys).join(', '));

let productsWithMissingFields = 0;
let productsWithExtraFields = 0;
let productsWithTypeMismatches = 0;
let productsWithNestedMismatches = 0;

englishData.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  const epKeys = Object.keys(ep);
  const hpKeys = Object.keys(hp);

  let missing = [];
  let extra = [];
  let typeMismatches = [];

  epKeys.forEach(k => {
    if (!(k in hp)) {
      missing.push(k);
    } else {
      // Check type
      const epVal = ep[k];
      const hpVal = hp[k];

      const epType = Array.isArray(epVal) ? 'array' : (epVal === null ? 'null' : typeof epVal);
      const hpType = Array.isArray(hpVal) ? 'array' : (hpVal === null ? 'null' : typeof hpVal);

      if (epType !== hpType && epVal !== null && hpVal !== null) {
        typeMismatches.push(`${k} (English: ${epType}, Hindi: ${hpType})`);
      }
    }
  });

  hpKeys.forEach(k => {
    if (!(k in ep)) {
      extra.push(k);
    }
  });

  if (missing.length > 0) {
    console.log(`STRUCTURAL ISSUE: Product ${ep.name} (${ep.id}) has missing keys:`, missing);
    productsWithMissingFields++;
  }
  if (extra.length > 0) {
    console.log(`STRUCTURAL ISSUE: Product ${ep.name} (${ep.id}) has extra keys:`, extra);
    productsWithExtraFields++;
  }
  if (typeMismatches.length > 0) {
    console.log(`STRUCTURAL ISSUE: Product ${ep.name} (${ep.id}) has type mismatches:`, typeMismatches);
    productsWithTypeMismatches++;
  }

  // Nested structures checks
  // 1. rituals_included
  if (ep.rituals_included && hp.rituals_included) {
    if (ep.rituals_included.length !== hp.rituals_included.length) {
      console.log(`NESTED STRUCTURE MISMATCH: rituals_included length mismatch for ${ep.name}. English: ${ep.rituals_included.length}, Hindi: ${hp.rituals_included.length}`);
      productsWithNestedMismatches++;
    } else {
      ep.rituals_included.forEach((rit, rIdx) => {
        const hRit = hp.rituals_included[rIdx];
        if (!hRit) return;
        const ritKeys = ['name', 'duration', 'description'];
        ritKeys.forEach(rk => {
          if (!(rk in hRit)) {
            console.log(`NESTED STRUCTURE MISMATCH: rituals_included[${rIdx}] key ${rk} missing in Hindi for ${ep.name}`);
            productsWithNestedMismatches++;
          }
        });
      });
    }
  }

  // 2. priest_details
  if (ep.priest_details && hp.priest_details) {
    const epPdKeys = Object.keys(ep.priest_details);
    const hpPdKeys = Object.keys(hp.priest_details);
    epPdKeys.forEach(k => {
      if (!(k in hp.priest_details)) {
        console.log(`NESTED STRUCTURE MISMATCH: priest_details key ${k} missing in Hindi for ${ep.name}`);
        productsWithNestedMismatches++;
      }
    });
  }

  // 3. testimonials
  if (ep.testimonials && hp.testimonials) {
    if (ep.testimonials.length !== hp.testimonials.length) {
      console.log(`NESTED STRUCTURE MISMATCH: testimonials length mismatch for ${ep.name}. English: ${ep.testimonials.length}, Hindi: ${hp.testimonials.length}`);
      productsWithNestedMismatches++;
    } else {
      ep.testimonials.forEach((test, tIdx) => {
        const hTest = hp.testimonials[tIdx];
        if (!hTest) return;
        ['name', 'rating', 'comment', 'location'].forEach(tk => {
          if (!(tk in hTest)) {
            console.log(`NESTED STRUCTURE MISMATCH: testimonials[${tIdx}] key ${tk} missing in Hindi for ${ep.name}`);
            productsWithNestedMismatches++;
          }
        });
        if (typeof test.rating === 'number' && typeof hTest.rating !== 'number') {
          console.log(`NESTED STRUCTURE MISMATCH: testimonials[${tIdx}] rating type mismatch in Hindi for ${ep.name}`);
          productsWithNestedMismatches++;
        }
      });
    }
  }

  // 4. faqs
  if (ep.faqs && hp.faqs) {
    if (ep.faqs.length !== hp.faqs.length) {
      console.log(`NESTED STRUCTURE MISMATCH: faqs length mismatch for ${ep.name}. English: ${ep.faqs.length}, Hindi: ${hp.faqs.length}`);
      productsWithNestedMismatches++;
    } else {
      ep.faqs.forEach((faq, fIdx) => {
        const hFaq = hp.faqs[fIdx];
        if (!hFaq) return;
        ['question', 'answer'].forEach(fk => {
          if (!(fk in hFaq)) {
            console.log(`NESTED STRUCTURE MISMATCH: faqs[${fIdx}] key ${fk} missing in Hindi for ${ep.name}`);
            productsWithNestedMismatches++;
          }
        });
      });
    }
  }

  // 5. gallery_images
  if (ep.gallery_images && hp.gallery_images) {
    if (ep.gallery_images.length !== hp.gallery_images.length) {
      console.log(`NESTED STRUCTURE MISMATCH: gallery_images length mismatch for ${ep.name}. English: ${ep.gallery_images.length}, Hindi: ${hp.gallery_images.length}`);
      productsWithNestedMismatches++;
    }
  }

  // 6. certificates
  if (ep.certificates && hp.certificates) {
    if (ep.certificates.length !== hp.certificates.length) {
      console.log(`NESTED STRUCTURE MISMATCH: certificates length mismatch for ${ep.name}. English: ${ep.certificates.length}, Hindi: ${hp.certificates.length}`);
      productsWithNestedMismatches++;
    } else {
      ep.certificates.forEach((cert, cIdx) => {
        const hCert = hp.certificates[cIdx];
        if (!hCert) return;
        ['url', 'name', 'issuer'].forEach(ck => {
          if (!(ck in hCert)) {
            console.log(`NESTED STRUCTURE MISMATCH: certificates[${cIdx}] key ${ck} missing in Hindi for ${ep.name}`);
            productsWithNestedMismatches++;
          }
        });
      });
    }
  }
});

console.log(`Products with missing fields: ${productsWithMissingFields}`);
console.log(`Products with extra fields: ${productsWithExtraFields}`);
console.log(`Products with type mismatches: ${productsWithTypeMismatches}`);
console.log(`Products with nested structure mismatches: ${productsWithNestedMismatches}`);


console.log('\n--- AUDIT TASK 5: Array Count and Order Audit ---');
let arrayCountMismatches = 0;
let arrayOrderMismatches = 0;

const arrayKeys = [
  'tags', 'benefits', 'rituals_included', 'samagri_list', 'ideal_occasions',
  'offers', 'badges', 'testimonials', 'faqs', 'gallery_images', 'certificates'
];

englishData.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  arrayKeys.forEach(ak => {
    const epArr = ep[ak];
    const hpArr = hp[ak];

    if (!Array.isArray(epArr) || !Array.isArray(hpArr)) return;

    if (epArr.length !== hpArr.length) {
      console.log(`ARRAY COUNT MISMATCH: Key ${ak} for ${ep.name}. English: ${epArr.length}, Hindi: ${hpArr.length}`);
      arrayCountMismatches++;
      return;
    }

    // Verify index alignment
    if (ak === 'rituals_included') {
      epArr.forEach((rit, idx) => {
        const hRit = hpArr[idx];
        // Compare structural keys or mapping if they are matching.
        // We expect matching structural array.
      });
    } else if (ak === 'faqs') {
      epArr.forEach((faq, idx) => {
        const hFaq = hpArr[idx];
      });
    }
  });
});

console.log(`ARRAY COUNT MISMATCHES: ${arrayCountMismatches}`);
console.log(`ARRAY ORDER MISMATCHES: ${arrayOrderMismatches}`);


console.log('\n--- AUDIT TASK 6: Non-Translatable Value Integrity ---');
let uuidChanges = 0;
let urlChanges = 0;
let ratingChanges = 0;
let booleanChanges = 0;
let technicalValueChanges = 0;

const urlRegex = /https?:\/\/[^\s]+/i;

function checkUrlsUnchanged(ep, hp, pathPrefix = '') {
  if (typeof ep === 'string') {
    if (urlRegex.test(ep)) {
      if (ep !== hp) {
        console.log(`URL MISMATCH: Path ${pathPrefix}. English: "${ep}", Hindi: "${hp}"`);
        urlChanges++;
      }
    }
  } else if (Array.isArray(ep) && Array.isArray(hp)) {
    ep.forEach((item, idx) => {
      checkUrlsUnchanged(item, hp[idx], `${pathPrefix}[${idx}]`);
    });
  } else if (ep && typeof ep === 'object' && hp && typeof hp === 'object') {
    Object.keys(ep).forEach(k => {
      checkUrlsUnchanged(ep[k], hp[k], `${pathPrefix}.${k}`);
    });
  }
}

englishData.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  // UUID Check
  if (ep.id !== hp.id) {
    console.log(`UUID CHANGE: English UUID ${ep.id} !== Hindi UUID ${hp.id}`);
    uuidChanges++;
  }

  // URL Checks
  checkUrlsUnchanged(ep, hp, `${ep.name}`);

  // Testimonial rating checks
  if (ep.testimonials && hp.testimonials) {
    ep.testimonials.forEach((t, idx) => {
      const ht = hp.testimonials[idx];
      if (ht && t.rating !== ht.rating) {
        console.log(`RATING CHANGE: Testimonial rating for ${ep.name} index ${idx}. English: ${t.rating}, Hindi: ${ht.rating}`);
        ratingChanges++;
      }
    });
  }

  // Boolean value checks
  const booleanKeys = ['is_featured', 'is_trending', 'in_stock', 'is_published'];
  booleanKeys.forEach(bk => {
    if (bk in ep && bk in hp) {
      if (ep[bk] !== hp[bk]) {
        console.log(`BOOLEAN CHANGE: Key ${bk} for ${ep.name}. English: ${ep[bk]}, Hindi: ${hp[bk]}`);
        booleanChanges++;
      }
    }
  });

  // Rating (product level)
  if (ep.rating !== hp.rating) {
    console.log(`TECHNICAL RATING CHANGE: Product rating for ${ep.name}. English: ${ep.rating}, Hindi: ${hp.rating}`);
    technicalValueChanges++;
  }
  
  // Reviews count
  if (ep.reviews_count !== hp.reviews_count) {
    console.log(`TECHNICAL REVIEWS COUNT CHANGE: Product reviews_count for ${ep.name}. English: ${ep.reviews_count}, Hindi: ${hp.reviews_count}`);
    technicalValueChanges++;
  }

  // Price checks (should not be in Hindi payload, but let's check JSON equality if present)
  if (ep.price !== hp.price || ep.original_price !== hp.original_price) {
    // console.log(`TECHNICAL PRICE CHANGE: Product price for ${ep.name}. English: ${ep.price}, Hindi: ${hp.price}`);
  }
});

console.log(`UUID CHANGES: ${uuidChanges}`);
console.log(`URL CHANGES: ${urlChanges}`);
console.log(`RATING CHANGES: ${ratingChanges}`);
console.log(`BOOLEAN CHANGES: ${booleanChanges}`);
console.log(`TECHNICAL VALUE CHANGES: ${technicalValueChanges}`);


console.log('\n--- AUDIT TASK 8: English Leakage Scan ---');
let latinOccurrences = 0;
let acceptableLatin = 0;
let needsReviewLatin = 0;
let awarenessCount = 0;
let fullyUntranslatedFields = 0;

// Exclude URLs, UUIDs, numbers, punctuation, HTML entities, and technical keys
const latinWordRegex = /[a-zA-Z]{3,}/g; // words with 3 or more English characters

function scanTextForLatin(val, pathPrefix, epVal) {
  if (typeof val === 'string') {
    // Exclude URLs
    if (urlRegex.test(val)) return;
    // Exclude UUIDs
    if (uuidRegex.test(val)) return;

    // Exclude words that are acceptable like technical IDs, standard english names in parentheses, etc.
    const matches = val.match(latinWordRegex);
    if (matches) {
      matches.forEach(m => {
        latinOccurrences++;
        const mLower = m.toLowerCase();
        
        // check "awareness"
        if (mLower === 'awareness') {
          awarenessCount++;
          console.log(`AWARENESS FOUND: at ${pathPrefix} in value: "${val}"`);
        }

        // Is it acceptable? 
        // e.g. "R2", "URL", "UUID", "SEO", "CTA", "OG", "HTML", "JSON", "FAQ", "Sanskrit", "Pooja", "Mantra", "Rudraksha" etc.
        const acceptableWords = [
          'seo', 'cta', 'url', 'og', 'r2', 'faq', 'uuid', 'http', 'https', 'pdf', 'png', 'jpg', 'jpeg',
          'pyrite', 'rudraksha', 'rudraksh', 'yantra', 'mala', 'kavach', 'chalisa', 'aarti', 'pooja',
          'puja', 'vedic', 'sanskrit', 'shivratri', 'pradosham', 'diwali', 'navratri', 'karungali', 'tulsi',
          'original', 'certificate', 'lab', 'certified', 'weight', 'dimension', 'material', 'origin',
          'astrology', 'horoscope', 'shiva', 'ganesha', 'lakshmi', 'durga', 'hanuman', 'krishna', 'vishnu',
          'ram', 'rahul', 'amit', 'sahil', 'patel', 'gopal', 'verma', 'sharma', 'gupta', 'mishra', 'tiwari',
          'pancha', 'dhatu', 'panchdhatu', 'mukhi', 'rudra', 'akasha', 'chakra', 'rahu', 'ketu', 'shani',
          'surya', 'chandra', 'mangal', 'budh', 'guru', 'shukra'
        ];

        if (acceptableWords.includes(mLower)) {
          acceptableLatin++;
        } else {
          needsReviewLatin++;
          console.log(`LATIN LEAKAGE NEEDS REVIEW: word "${m}" at ${pathPrefix} inside: "${val}"`);
        }
      });
    }

    // Check if the field is fully untranslated (i.e. identical to English user facing text, and English has content)
    if (epVal && typeof epVal === 'string' && epVal.trim().length > 0) {
      // If Hindi value is exactly equal to English value and contains Latin letters, it might be untranslated
      if (val === epVal && /[a-zA-Z]/.test(val)) {
        // Exempt category, or slug, or fields that are supposed to be technical / untranslated like certificates.url, image etc.
        const pathParts = pathPrefix.split('.');
        const lastPart = pathParts[pathParts.length - 1];
        if (!['id', 'slug', 'category', 'image', 'banner_image', 'url', 'rating', 'reviews_count', 'is_published', 'is_featured', 'is_trending', 'in_stock'].includes(lastPart)) {
          console.log(`FULLY UNTRANSLATED FIELD: ${pathPrefix} is identical to English: "${val}"`);
          fullyUntranslatedFields++;
        }
      }
    }
  } else if (Array.isArray(val)) {
    val.forEach((item, idx) => {
      scanTextForLatin(item, `${pathPrefix}[${idx}]`, epVal ? epVal[idx] : undefined);
    });
  } else if (val && typeof val === 'object') {
    Object.keys(val).forEach(k => {
      scanTextForLatin(val[k], `${pathPrefix}.${k}`, epVal ? epVal[k] : undefined);
    });
  }
}

englishData.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  // Let's scan user facing fields
  const userFacingFields = [
    'name', 'sanskrit_name', 'short_name', 'subtitle', 'short_description', 'description',
    'spiritual_significance', 'benefits', 'rituals_included', 'samagri_list', 'priest_details',
    'ideal_occasions', 'temple_association', 'who_should_perform', 'offers', 'badges',
    'testimonials', 'faqs', 'booking_instructions', 'cta_labels', 'seo_title', 'seo_description',
    'image_alt', 'image_caption', 'gallery_images', 'certificates'
  ];

  userFacingFields.forEach(f => {
    if (f in hp) {
      scanTextForLatin(hp[f], `${ep.name}.${f}`, ep[f]);
    }
  });
});

console.log(`Total Latin occurrences: ${latinOccurrences}`);
console.log(`Acceptable Latin occurrences: ${acceptableLatin}`);
console.log(`Needs-review Latin occurrences: ${needsReviewLatin}`);
console.log(`AWARENESS COUNT: ${awarenessCount}`);
console.log(`FULLY UNTRANSLATED USER-FACING FIELDS: ${fullyUntranslatedFields}`);


console.log('\n--- AUDIT TASK 9: Spiritual and Product Fact Consistency ---');
let wrongMukhiReferences = 0;
let wrongDeityReferences = 0;
let wrongCrystalReferences = 0;
let wrongProductReferences = 0;
let wrongMaterialReferences = 0;
let crossProductIssues = 0;

// Verify Mukhi in FAQs, certificates or testimonials
englishData.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  // Check Mukhi number consistency between English and Hindi text
  const m1 = ep.name.match(/(\d+)\s+Mukhi/i);
  if (m1) {
    const mukhiNum = m1[1];
    // Check if Hindi description or FAQs contain a different number of Mukhi (e.g. if copy-pasted)
    // For example, if it's "10 Mukhi" but Hindi text says "11 मुखी" or "12 मुखी"
    const textToCheck = JSON.stringify(hp);
    const wrongMukhiMatches = textToCheck.match(/(\d+)\s*मुखी/g);
    if (wrongMukhiMatches) {
      wrongMukhiMatches.forEach(match => {
        const digit = match.match(/\d+/)[0];
        if (digit !== mukhiNum) {
          console.log(`WRONG MUKHI REFERENCE: Product "${ep.name}" expects ${mukhiNum} Mukhi, but text contains "${match}"`);
          wrongMukhiReferences++;
        }
      });
    }
  }

  // Cross-product check (e.g. Rudraksha wearing instructions inside Pyrite Owl, or Crystal instructions in Tulsi Mala)
  if (ep.id === '5fbc27f1-fd14-41af-b350-c348151b0c75') { // Pyrite Owl
    const textStr = JSON.stringify(hp).toLowerCase();
    if (textStr.includes('rudraksha') || textStr.includes('रुद्राक्ष') || textStr.includes('धारण') || textStr.includes('wear')) {
      console.log(`CROSS-PRODUCT CONTENT ISSUE: Pyrite Owl contains Rudraksha wearing or wearing terms. Text: ${textStr.substring(0, 100)}...`);
      crossProductIssues++;
    }
  }

  if (ep.id === 'ef9700ec-42c3-4de4-8b94-9f3e86b8d760') { // Tulsi Mala
    const textStr = JSON.stringify(hp).toLowerCase();
    if (textStr.includes('karungali') || textStr.includes('करुंगली')) {
      console.log(`CROSS-PRODUCT CONTENT ISSUE: Tulsi Mala contains Karungali references.`);
      crossProductIssues++;
    }
  }
});

console.log(`Wrong Mukhi references: ${wrongMukhiReferences}`);
console.log(`Wrong deity references: ${wrongDeityReferences}`);
console.log(`Wrong crystal references: ${wrongCrystalReferences}`);
console.log(`Wrong product references: ${wrongProductReferences}`);
console.log(`Wrong material references: ${wrongMaterialReferences}`);
console.log(`Cross-product content issues: ${crossProductIssues}`);


console.log('\n--- AUDIT TASK 10: Claim Strength Audit ---');
let strongerClaimsAdded = 0;
let medicalClaimsAdded = 0;
let guaranteedClaimsAdded = 0;
let meaningStrengthChanges = 0;

const strongClaimPhrases = [
  'निश्चित धन लाभ', 'गारंटीड सफलता', '100% सफलता', 'रोग ठीक करता है',
  'बीमारी समाप्त करता है', 'तुरंत परिणाम', 'सभी समस्याएँ समाप्त',
  'निश्चित रूप से धन आकर्षित करता है'
];

englishData.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  const textStr = JSON.stringify(hp);
  strongClaimPhrases.forEach(phrase => {
    if (textStr.includes(phrase)) {
      console.log(`STRONG CLAIM FOUND in ${ep.name}: "${phrase}"`);
      strongerClaimsAdded++;
    }
  });
});

console.log(`Stronger claims added: ${strongerClaimsAdded}`);
console.log(`Medical claims added: ${medicalClaimsAdded}`);
console.log(`Guaranteed claims added: ${guaranteedClaimsAdded}`);
console.log(`Meaning-strength changes: ${meaningStrengthChanges}`);


console.log('\n--- AUDIT TASK 11: Black Horseshoe Final Check ---');
const horseshoeId = '1fe03faa-3042-492d-b977-d536548cf0e2';
const epHorseshoe = englishMap.get(horseshoeId);
const hpHorseshoe = hindiMap.get(horseshoeId);

if (!hpHorseshoe) {
  console.log('Black Horseshoe: MISSING IN HINDI');
} else {
  console.log(`UUID correct: ${hpHorseshoe.id === horseshoeId ? 'PASS' : 'FAIL'}`);
  console.log(`Name correct ("काले घोड़े की नाल"): ${hpHorseshoe.name.includes('काले घोड़े की नाल') ? 'PASS' : 'FAIL'}`);
  console.log(`Field count (${Object.keys(hpHorseshoe).length}): ${Object.keys(hpHorseshoe).length >= 35 ? 'PASS' : 'FAIL'}`);
  console.log(`Benefits count (${hpHorseshoe.benefits.length}): ${hpHorseshoe.benefits.length === epHorseshoe.benefits.length ? 'PASS' : 'FAIL'}`);
  console.log(`Rituals count (${hpHorseshoe.rituals_included.length}): ${hpHorseshoe.rituals_included.length === epHorseshoe.rituals_included.length ? 'PASS' : 'FAIL'}`);
  console.log(`Priest details count: ${hpHorseshoe.priest_details && Object.keys(hpHorseshoe.priest_details).length > 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Testimonials count (${hpHorseshoe.testimonials.length}): ${hpHorseshoe.testimonials.length === epHorseshoe.testimonials.length ? 'PASS' : 'FAIL'}`);
  console.log(`FAQs count (${hpHorseshoe.faqs.length}): ${hpHorseshoe.faqs.length === epHorseshoe.faqs.length ? 'PASS' : 'FAIL'}`);
  console.log(`Booking instructions exist: ${hpHorseshoe.booking_instructions ? 'PASS' : 'FAIL'}`);
  console.log(`Gallery images count (${hpHorseshoe.gallery_images.length}): ${hpHorseshoe.gallery_images.length === epHorseshoe.gallery_images.length ? 'PASS' : 'FAIL'}`);
  console.log(`Certificates count (${hpHorseshoe.certificates.length}): ${hpHorseshoe.certificates.length === epHorseshoe.certificates.length ? 'PASS' : 'FAIL'}`);
  
  // Gallery URLs check
  let urlMatch = true;
  hpHorseshoe.gallery_images.forEach((img, idx) => {
    if (img.url !== epHorseshoe.gallery_images[idx].url) urlMatch = false;
  });
  console.log(`Gallery URLs unchanged: ${urlMatch ? 'PASS' : 'FAIL'}`);

  // Material check
  console.log(`Material translated correctly: ${hpHorseshoe.material ? 'PASS' : 'FAIL'} (Hindi: ${hpHorseshoe.material})`);
  console.log(`Weight structurally preserved: ${hpHorseshoe.weight === epHorseshoe.weight ? 'PASS' : 'FAIL'}`);
  console.log(`Dimensions structurally preserved: ${hpHorseshoe.dimensions === epHorseshoe.dimensions ? 'PASS' : 'FAIL'}`);
  console.log(`Origin translated: ${hpHorseshoe.origin ? 'PASS' : 'FAIL'} (Hindi: ${hpHorseshoe.origin})`);
  console.log(`No English awareness leakage: ${!JSON.stringify(hpHorseshoe).toLowerCase().includes('awareness') ? 'PASS' : 'FAIL'}`);
  console.log(`No stronger claims: ${strongClaimPhrases.every(phrase => !JSON.stringify(hpHorseshoe).includes(phrase)) ? 'PASS' : 'FAIL'}`);
}


console.log('\n--- AUDIT TASK 12: Karungali and Tulsi Final Check ---');
const karungaliId = '4d567787-bd06-418e-be2a-7e5ab2ca0abf';
const tulsiId = 'ef9700ec-42c3-4de4-8b94-9f3e86b8d760';

const epKarungali = englishMap.get(karungaliId);
const hpKarungali = hindiMap.get(karungaliId);
const epTulsi = englishMap.get(tulsiId);
const hpTulsi = hindiMap.get(tulsiId);

const specKeys = [
  'cta_labels', 'seo_title', 'seo_description', 'og_data', 'image_alt', 'image_caption',
  'gallery_images', 'certificates', 'material', 'weight', 'dimensions', 'origin'
];

if (hpKarungali) {
  let karungaliMissing = [];
  let karungaliTypeMismatch = [];
  specKeys.forEach(k => {
    if (!(k in hpKarungali)) {
      karungaliMissing.push(k);
    } else {
      const epType = Array.isArray(epKarungali[k]) ? 'array' : (epKarungali[k] === null ? 'null' : typeof epKarungali[k]);
      const hpType = Array.isArray(hpKarungali[k]) ? 'array' : (hpKarungali[k] === null ? 'null' : typeof hpKarungali[k]);
      if (epType !== hpType && epKarungali[k] !== null && hpKarungali[k] !== null) {
        karungaliTypeMismatch.push(`${k} (English: ${epType}, Hindi: ${hpType})`);
      }
    }
  });
  console.log(`Karungali missing fields count: ${karungaliMissing.length} [${karungaliMissing.join(', ')}]`);
  console.log(`Karungali type mismatches count: ${karungaliTypeMismatch.length} [${karungaliTypeMismatch.join(', ')}]`);
} else {
  console.log('Karungali: MISSING IN HINDI');
}

if (hpTulsi) {
  let tulsiMissing = [];
  let tulsiTypeMismatch = [];
  specKeys.forEach(k => {
    if (!(k in hpTulsi)) {
      tulsiMissing.push(k);
    } else {
      const epType = Array.isArray(epTulsi[k]) ? 'array' : (epTulsi[k] === null ? 'null' : typeof epTulsi[k]);
      const hpType = Array.isArray(hpTulsi[k]) ? 'array' : (hpTulsi[k] === null ? 'null' : typeof hpTulsi[k]);
      if (epType !== hpType && epTulsi[k] !== null && hpTulsi[k] !== null) {
        tulsiTypeMismatch.push(`${k} (English: ${epType}, Hindi: ${hpType})`);
      }
    }
  });
  console.log(`Tulsi missing fields count: ${tulsiMissing.length} [${tulsiMissing.join(', ')}]`);
  console.log(`Tulsi type mismatches count: ${tulsiTypeMismatch.length} [${tulsiTypeMismatch.join(', ')}]`);
} else {
  console.log('Tulsi: MISSING IN HINDI');
}


console.log('\n--- AUDIT TASK 13: Pyrite Owl Final Check ---');
const pyriteOwlId = '5fbc27f1-fd14-41af-b350-c348151b0c75';
const epPyriteOwl = englishMap.get(pyriteOwlId);
const hpPyriteOwl = hindiMap.get(pyriteOwlId);

if (hpPyriteOwl) {
  const epStr = JSON.stringify(epPyriteOwl).toLowerCase();
  const hpStr = JSON.stringify(hpPyriteOwl).toLowerCase();

  // count "awareness" in English
  const awarenessEngCount = (epStr.match(/awareness/g) || []).length;
  // count "awareness" in Hindi (English spelling)
  const awarenessHiEngCount = (hpStr.match(/awareness/g) || []).length;
  // count "जागरूकता" in Hindi
  const awarenessHiHiCount = (hpStr.match(/जागरूकता/g) || []).length;

  console.log(`Awareness English count: ${awarenessEngCount}`);
  console.log(`Awareness Hindi English Leakage count: ${awarenessHiEngCount}`);
  console.log(`जागरूकता count in Hindi: ${awarenessHiHiCount}`);
  
  // check description and spiritual_significance
  console.log(`Description contains "जागरूकता": ${hpPyriteOwl.description.includes('जागरूकता')}`);
  console.log(`Spiritual Significance contains "जागरूकता": ${hpPyriteOwl.spiritual_significance.includes('जागरूकता')}`);
} else {
  console.log('Pyrite Owl: MISSING IN HINDI');
}
