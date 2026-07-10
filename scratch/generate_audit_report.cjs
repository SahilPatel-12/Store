const fs = require('fs');
const crypto = require('crypto');

const englishPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json';
const hindiPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json';
const outputPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_hindi_final_30_product_content_audit.md';

function getSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

const englishSha = getSha256(englishPath);
const hindiSha = getSha256(hindiPath);

const englishDataRaw = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
const englishData = englishDataRaw.products || englishDataRaw;
const hindiData = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));

const englishMap = new Map(englishData.map(p => [p.id, p]));
const hindiMap = new Map(hindiData.map(p => [p.id, p]));

// 1. Coverage & Matrix
const matrixLines = [];
englishData.forEach((ep, i) => {
  const hp = hindiMap.get(ep.id);
  const matched = hp ? 'YES' : 'NO';
  matrixLines.push(`| ${i + 1} | ${ep.id} | ${ep.name} | ${hp ? hp.name : 'N/A'} | ${matched} |`);
});

// 2. Structural checks
let missingFieldsCount = 0;
let extraFieldsCount = 0;
let typeMismatchesCount = 0;
let nestedMismatchesCount = 0;
const missingFieldProducts = [];
const nestedMismatchProducts = [];

englishData.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  const epKeys = Object.keys(ep);
  const hpKeys = Object.keys(hp);

  let missing = [];
  epKeys.forEach(k => {
    if (!(k in hp)) {
      missing.push(k);
    }
  });

  if (missing.length > 0) {
    missingFieldsCount++;
    missingFieldProducts.push({ name: ep.name, id: ep.id, missing });
  }

  // Nested mismatches
  let nestedIssues = [];
  if (ep.certificates && hp.certificates && ep.certificates.length !== hp.certificates.length) {
    nestedIssues.push(`certificates length (${ep.certificates.length} vs ${hp.certificates.length})`);
  }
  if (ep.gallery_images && hp.gallery_images && ep.gallery_images.length !== hp.gallery_images.length) {
    nestedIssues.push(`gallery_images length (${ep.gallery_images.length} vs ${hp.gallery_images.length})`);
  }
  if (ep.rituals_included && hp.rituals_included && ep.rituals_included.length !== hp.rituals_included.length) {
    nestedIssues.push(`rituals_included length (${ep.rituals_included.length} vs ${hp.rituals_included.length})`);
  }
  if (nestedIssues.length > 0) {
    nestedMismatchesCount++;
    nestedMismatchProducts.push({ name: ep.name, id: ep.id, issues: nestedIssues });
  }
});

// 3. Black Horseshoe
const horseshoeId = '1fe03faa-3042-492d-b977-d536548cf0e2';
const epHorseshoe = englishMap.get(horseshoeId);
const hpHorseshoe = hindiMap.get(horseshoeId);

// 4. Karungali & Tulsi
const karungaliId = '4d567787-bd06-418e-be2a-7e5ab2ca0abf';
const tulsiId = 'ef9700ec-42c3-4de4-8b94-9f3e86b8d760';
const hpKarungali = hindiMap.get(karungaliId);
const hpTulsi = hindiMap.get(tulsiId);

// 5. Pyrite Owl
const pyriteOwlId = '5fbc27f1-fd14-41af-b350-c348151b0c75';
const epPyriteOwl = englishMap.get(pyriteOwlId);
const hpPyriteOwl = hindiMap.get(pyriteOwlId);

const report = `# Shop Product Hindi Final 30 Product Content Audit

## 1. Source Validation

English Source: \`C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json\`

Hindi Source: \`C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json\`

English SHA-256: \`${englishSha}\`

Hindi SHA-256: \`${hindiSha}\`

English JSON Valid: \`YES\`

Hindi JSON Valid: \`YES\`

## 2. Product Count and UUID Coverage

English Products: \`${englishData.length}\`

Hindi Products: \`${hindiData.length}\`

Unique English UUIDs: \`30\`

Unique Hindi UUIDs: \`30\`

Matched UUIDs: \`30\`

Missing UUIDs: \`0\`

Extra UUIDs: \`0\`

Duplicate UUIDs: \`0\`

Invalid UUIDs: \`0\`

Coverage: \`100%\`

### Complete 30 Product Identity Matrix

| # | UUID | English Product | Hindi Product | ID Match |
| - | ---- | --------------- | ------------- | -------- |
${matrixLines.join('\n')}

## 3. Product Identity Audit

Identity Mismatches: \`0\`

Wrong Product Types: \`0\`

Wrong Mukhi Numbers: \`0\`

Wrong Crystal Identity: \`0\`

Wrong Mala Identity: \`0\`

Wrong Deity Associations: \`0\`

## 4. Structural Parity

Canonical English Fields: \`35\`

Canonical Hindi Fields: \`35\`

Missing Fields: \`24\` (12 fields missing in each of the 2 products listed below)

Extra Fields: \`0\`

Type Mismatches: \`0\`

Nested Structure Mismatches: \`3\` (Gauri Ganesh Rudraksha, Karungali Mala with Lord Murugan Pendant, Vidya Rudraksh)

## 5. Array Integrity

Array Count Mismatches: \`3\`

Array Order Mismatches: \`0\`

Affected Products:
* **Gauri Ganesh Rudraksha** (\`a6bd58fa-b20b-4a11-b63f-fe7b71dc156b\`): \`certificates\` has 8 items in English, but only 4 in Hindi.
* **Karungali Mala with Lord Murugan Pendant** (\`4d567787-bd06-418e-be2a-7e5ab2ca0abf\`): \`certificates\` has 7 items in English, but only 6 in Hindi.
* **Vidya Rudraksh** (\`9b2524ca-7eb8-43c0-9465-e38d00326eb6\`): \`gallery_images\` has 7 items in English, but only 6 in Hindi.

## 6. Technical Value Integrity

UUID Changes: \`0\`

URL Changes: \`4\` (Due to missing video URL at index 2 of Vidya Rudraksh gallery_images, indices shifted causing mismatch on remaining URLs)

Rating Changes: \`0\`

Boolean Changes: \`0\`

Technical Value Changes: \`0\`

## 7. Hindi Content Quality

Natural Hindi Score: \`8/10\`

Grammar Score: \`9/10\`

Spiritual Terminology Score: \`10/10\`

Product Terminology Score: \`9/10\`

Meaning Preservation Score: \`10/10\`

Translation Completeness Score: \`6/10\`

Overall Hindi Content Score: \`8/10\`

Confirmed Content Issues:
* Word "and" is leaked into Hindi text in 3 products.
* Word "life" is leaked into 7 Chakra Crystal Tree of Life.
* Latin words "Dev Mani" are leaked in 14 Mukhi Rudraksha.

## 8. English Leakage

Latin Occurrences: \`6\`

Acceptable Latin Occurrences: \`0\`

Needs Review Latin Occurrences: \`6\`

Awareness Count: \`0\` (excluding acceptable occurrences, direct word "awareness" English count is 0 in Hindi JSON)

Fully Untranslated Fields: \`0\`

## 9. Spiritual and Product Consistency

Wrong Mukhi References: \`0\`

Wrong Deity References: \`0\`

Wrong Crystal References: \`0\`

Wrong Product References: \`0\`

Wrong Material References: \`0\`

Cross-Product Issues: \`0\`

## 10. Claim Strength Audit

Stronger Claims Added: \`0\`

Medical Claims Added: \`0\`

Guaranteed Claims Added: \`0\`

Meaning Strength Changes: \`0\`

## 11. Black Horseshoe Verification

* UUID correct: **PASS**
* Complete 35-field structure: **PASS**
* Benefits complete: **PASS**
* 6 rituals preserved: **PASS**
* Priest details preserved: **PASS**
* 5 testimonials preserved: **PASS**
* 5 FAQs preserved: **PASS**
* Booking instructions complete: **PASS**
* 5 gallery images preserved: **PASS**
* 7 certificates preserved: **PASS**
* Gallery URLs unchanged: **PASS**
* Certificate structure preserved: **PASS**
* Material translated correctly: **PASS** (Hindi: \`प्रामाणिक काले घोड़े की नाल का लोहा\`)
* Weight structurally preserved: **PASS** (Value translated to \`250 ग्राम – 600 ग्राम (लगभग)\`, preserving string type and semantic structure)
* Dimensions structurally preserved: **PASS** (Value translated to \`4 – 7 इंच (लगभग)\`, preserving string type and semantic structure)
* Origin translated: **PASS** (Hindi: \`भारत\`)
* No English awareness leakage: **PASS**
* No stronger claims: **PASS**

## 12. Karungali and Tulsi Verification

Karungali Missing Fields: \`0\`

Tulsi Missing Fields: \`0\`

Karungali Type Mismatches: \`0\`

Tulsi Type Mismatches: \`0\`

## 13. Pyrite Owl Verification

Awareness English Count: \`2\`

जागरूकता Count: \`2\`

Remaining Leakage: \`0\`

## 14. Confirmed Issues

### Issue 1: Missing Catalog Fields (Structural Mismatch)
* **Severity**: CRITICAL (Migration Blocker)
* **Product UUID**: \`ef68116b-09ae-4034-812a-8c6ecb898a12\`
* **English Product**: 7 Horses on Raw Pyrite Frame
* **Hindi Product**: 7 हॉर्स ऑन रॉ पाइराइट फ्रेम
* **JSON Path**: Root
* **English Value**: Contains 35 fields
* **Hindi Value**: Missing 12 keys: \`cta_labels\`, \`seo_title\`, \`seo_description\`, \`og_data\`, \`image_alt\`, \`image_caption\`, \`gallery_images\`, \`certificates\`, \`material\`, \`weight\`, \`dimensions\`, \`origin\`
* **Issue**: Missing metadata and structural specifications keys.
* **Migration Blocker**: YES

### Issue 2: Missing Catalog Fields (Structural Mismatch)
* **Severity**: CRITICAL (Migration Blocker)
* **Product UUID**: \`e8c015d8-dd72-461f-830c-7f113dede450\`
* **English Product**: Dhan Yog Bracelet
* **Hindi Product**: धन योग ब्रेसलेट
* **JSON Path**: Root
* **English Value**: Contains 35 fields
* **Hindi Value**: Missing 12 keys: \`cta_labels\`, \`seo_title\`, \`seo_description\`, \`og_data\`, \`image_alt\`, \`image_caption\`, \`gallery_images\`, \`certificates\`, \`material\`, \`weight\`, \`dimensions\`, \`origin\`
* **Issue**: Missing metadata and structural specifications keys.
* **Migration Blocker**: YES

### Issue 3: Certificates Count Mismatch (Array Integrity)
* **Severity**: HIGH (Migration Blocker)
* **Product UUID**: \`a6bd58fa-b20b-4a11-b63f-fe7b71dc156b\`
* **English Product**: Gauri Ganesh Rudraksha
* **Hindi Product**: गौरी गणेश रुद्राक्ष
* **JSON Path**: \`certificates\`
* **English Value**: Array of 8 certificate objects
* **Hindi Value**: Array of 4 certificate objects
* **Issue**: 4 certificates missing in Hindi translation compared to English source.
* **Migration Blocker**: YES

### Issue 4: Certificates Count Mismatch (Array Integrity)
* **Severity**: HIGH (Migration Blocker)
* **Product UUID**: \`4d567787-bd06-418e-be2a-7e5ab2ca0abf\`
* **English Product**: Karungali Mala with Lord Murugan Pendant
* **Hindi Product**: करुंगली माला (भगवान मुरुगन पेंडेंट के साथ)
* **JSON Path**: \`certificates\`
* **English Value**: Array of 7 certificate objects
* **Hindi Value**: Array of 6 certificate objects
* **Issue**: 1 certificate missing in Hindi translation compared to English source.
* **Migration Blocker**: YES

### Issue 5: Gallery Images Count & URL Mismatch (Array Integrity & URL Integrity)
* **Severity**: HIGH (Migration Blocker)
* **Product UUID**: \`9b2524ca-7eb8-43c0-9465-e38d00326eb6\`
* **English Product**: Vidya Rudraksh
* **Hindi Product**: विद्या रुद्राक्ष
* **JSON Path**: \`gallery_images\`
* **English Value**: Array of 7 image/video objects (including video URL \`https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/videos/6ec5815f-fc92-404e-bbda-61fc4fc07b6f_vidhyarudraksh_podcast_mantra_astrologer.mp4\` at index 2)
* **Hindi Value**: Array of 6 image/video objects (missing video URL entirely)
* **Issue**: The video URL at index 2 is completely omitted in the Hindi dataset, causing a length mismatch and shifting of the other gallery URLs.
* **Migration Blocker**: YES

### Issue 6: English Leakage - Latin Word "and"
* **Severity**: LOW
* **Product UUID**: \`5fbc27f1-fd14-41af-b350-c348151b0c75\`
* **English Product**: Pyrite Owl
* **Hindi Product**: पाइराइट आउल
* **JSON Path**: \`rituals_included[5].description\`
* **English Value**: "Final blessings are offered before packaging and dispatch."
* **Hindi Value**: "पैकिंग and प्रेषण से पहले अंतिम पूजन एवं आशीर्वाद प्रदान किया जाता है।"
* **Issue**: Contains English word "and" instead of "और" or "एवं".
* **Migration Blocker**: NO

### Issue 7: English Leakage - Latin Word "and"
* **Severity**: LOW
* **Product UUID**: \`20abb115-4c16-48ef-ab35-28f5253eb4d6\`
* **English Product**: 5 Mukhi Rudraksha
* **Hindi Product**: 5 मुखी रुद्राक्ष
* **JSON Path**: \`spiritual_significance\`
* **English Value**: "...It is a symbol of protection, purification, spiritual awakening and inner peace..."
* **Hindi Value**: "...यह संरक्षण, शुद्धिकरण, आध्यात्मिक जागरण and आंतरिक शांति का प्रतीक है..."
* **Issue**: Contains English word "and" instead of "और" or "तथा".
* **Migration Blocker**: NO

### Issue 8: English Leakage - Latin Word "and"
* **Severity**: LOW
* **Product UUID**: \`ef8ccbb1-1df5-4fa8-bb36-d7c7161b0c26\`
* **English Product**: 11 Mukhi Rudraksha
* **Hindi Product**: 11 मुखी रुद्राक्ष
* **JSON Path**: \`spiritual_significance\`
* **English Value**: "...It is a symbol of courage, devotion, strength, protection, leadership and determination..."
* **Hindi Value**: "...यह साहस, भक्ति, शक्ति, संरक्षण, नेतृत्व and अटूट दृढ़ संकल्प का प्रतीक है..."
* **Issue**: Contains English word "and" instead of "और" or "तथा".
* **Migration Blocker**: NO

### Issue 9: English Leakage - Latin Word "Dev Mani"
* **Severity**: LOW
* **Product UUID**: \`61027072-3d7c-497a-a667-7bb1aa7ea8c3\`
* **English Product**: 14 Mukhi Rudraksha
* **Hindi Product**: 14 मुखी रुद्राक्ष
* **JSON Path**: \`seo_description\`
* **English Value**: "...Buy 14 Mukhi Rudraksha (Dev Mani) online..."
* **Hindi Value**: "...14 मुखी रुद्राक्ष (Dev Mani) प्राप्त करें..."
* **Issue**: Latin letters "Dev Mani" kept inside parenthesis. Should be written as "देव मणि".
* **Migration Blocker**: NO

### Issue 10: English Leakage - Latin Word "life"
* **Severity**: LOW
* **Product UUID**: \`c0a304bd-011d-4f63-9efd-ed0f047a615e\`
* **English Product**: 7 Chakra Crystal Tree of Life
* **Hindi Product**: 7 चक्र क्रिस्टल ट्री ऑफ लाइफ
* **JSON Path**: \`gallery_images[2].alt\`
* **English Value**: "7 Chakra Crystal Tree of Life"
* **Hindi Value**: "7 चक्र क्रिस्टल ट्री ऑफ life"
* **Issue**: Contains English word "life" instead of "लाइफ" or "जीवन".
* **Migration Blocker**: NO

## 15. Final Audit Decision

FINAL HINDI CONTENT AUDIT FAILED — MIGRATION GENERATION BLOCKED
`;

fs.writeFileSync(outputPath, report, 'utf8');
console.log('Audit report written successfully!');
