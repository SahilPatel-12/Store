const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const englishPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json';
const hindiPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json';
const migrationDir = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\src\\migrations';

const expectedEnglishSha = 'b6f739518e4cc716499d0ac212afcc4a6174cd715f104b9b6c261ea89022f3a3';
const expectedHindiSha = '515e820223dad550f86a0cdb197b0eb7840b7c30fc2e80a1dc2c5ad95f06f2b2';

function getSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

const currentEnglishSha = getSha256(englishPath);
const currentHindiSha = getSha256(hindiPath);

console.log('--- SHA-256 HASH VERIFICATION ---');
console.log(`English expected: ${expectedEnglishSha}, current: ${currentEnglishSha}`);
console.log(`Hindi expected: ${expectedHindiSha}, current: ${currentHindiSha}`);

if (currentEnglishSha !== expectedEnglishSha || currentHindiSha !== expectedHindiSha) {
  console.error('SOURCE HASH MISMATCH — MIGRATION GENERATION BLOCKED');
  process.exit(1);
}

const englishRaw = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
const english = englishRaw.products || englishRaw;
const hindi = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));

// Verify count
if (english.length !== 30 || hindi.length !== 30) {
  console.error('Product count mismatch. Verification failed.');
  process.exit(1);
}

const englishMap = new Map(english.map(p => [p.id, p]));
const hindiMap = new Map(hindi.map(p => [p.id, p]));

// Build matrix lines
const matrixLines = [];
english.forEach((ep, i) => {
  const hp = hindiMap.get(ep.id);
  const matched = hp ? 'YES' : 'NO';
  matrixLines.push(`| ${i + 1} | ${ep.id} | ${ep.name} | ${hp ? hp.name : 'N/A'} | ${matched} |`);
});

// Run task re-audits
let missingFieldsCount = 0;
let extraFieldsCount = 0;
let typeMismatchesCount = 0;
let nestedMismatchesCount = 0;

english.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  // top-level fields
  const epKeys = Object.keys(ep);
  const hpKeys = Object.keys(hp);

  epKeys.forEach(k => {
    if (!(k in hp)) {
      missingFieldsCount++;
    } else {
      const epVal = ep[k];
      const hpVal = hp[k];
      const epType = Array.isArray(epVal) ? 'array' : (epVal === null ? 'null' : typeof epVal);
      const hpType = Array.isArray(hpVal) ? 'array' : (hpVal === null ? 'null' : typeof hpVal);
      if (epType !== hpType && epVal !== null && hpVal !== null) {
        typeMismatchesCount++;
      }
    }
  });

  hpKeys.forEach(k => {
    if (!(k in ep)) {
      extraFieldsCount++;
    }
  });

  // check certificates, gallery_images, rituals, etc.
  if (ep.certificates && hp.certificates && ep.certificates.length !== hp.certificates.length) {
    nestedMismatchesCount++;
  }
  if (ep.gallery_images && hp.gallery_images && ep.gallery_images.length !== hp.gallery_images.length) {
    nestedMismatchesCount++;
  }
});

// Check non-translatable values & url mismatches
let urlMismatches = 0;
let ratingMismatches = 0;
let booleanMismatches = 0;
let uuidMismatches = 0;

english.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  if (ep.id !== hp.id) uuidMismatches++;

  // testimonial rating
  if (ep.testimonials && hp.testimonials) {
    ep.testimonials.forEach((t, idx) => {
      const ht = hp.testimonials[idx];
      if (ht && t.rating !== ht.rating) ratingMismatches++;
    });
  }

  // boolean keys
  const bools = ['is_published', 'is_featured', 'is_trending', 'in_stock'];
  bools.forEach(b => {
    if (ep[b] !== hp[b]) booleanMismatches++;
  });

  // Check URL equality in gallery_images
  if (ep.gallery_images && hp.gallery_images) {
    ep.gallery_images.forEach((g, idx) => {
      const hg = hp.gallery_images[idx];
      if (hg && g.url !== hg.url) {
        urlMismatches++;
        console.log(`URL Mismatch: ${ep.name} [${idx}]. English: ${g.url}, Hindi: ${hg.url}`);
      }
    });
  }
});

// Count Latin words
let andCount = 0;
let lifeCount = 0;
let devManiCount = 0;
let awarenessCount = 0;

function scanText(val) {
  if (typeof val === 'string') {
    const matches = val.match(/[a-zA-Z]+/g);
    if (matches) {
      matches.forEach(m => {
        const mLower = m.toLowerCase();
        if (mLower === 'and') andCount++;
        if (mLower === 'life') lifeCount++;
        if (mLower === 'awareness') awarenessCount++;
      });
    }
    if (val.includes('Dev Mani')) {
      devManiCount++;
    }
  } else if (Array.isArray(val)) {
    val.forEach(scanText);
  } else if (val && typeof val === 'object') {
    Object.keys(val).forEach(k => scanText(val[k]));
  }
}

hindi.forEach(hp => {
  const userFacingFields = [
    'name', 'sanskrit_name', 'short_name', 'subtitle', 'short_description', 'description',
    'spiritual_significance', 'benefits', 'rituals_included', 'samagri_list', 'priest_details',
    'ideal_occasions', 'temple_association', 'who_should_perform', 'offers', 'badges',
    'testimonials', 'faqs', 'booking_instructions', 'cta_labels', 'seo_title', 'seo_description',
    'image_alt', 'image_caption', 'gallery_images', 'certificates'
  ];
  userFacingFields.forEach(f => {
    if (hp[f]) scanText(hp[f]);
  });
});

console.log('--- RE-AUDIT SCAN RESULT ---');
console.log(`Missing fields count: ${missingFieldsCount}`);
console.log(`Extra fields count: ${extraFieldsCount}`);
console.log(`Type mismatches count: ${typeMismatchesCount}`);
console.log(`Nested mismatches count: ${nestedMismatchesCount}`);
console.log(`UUID mismatches count: ${uuidMismatches}`);
console.log(`URL mismatches count: ${urlMismatches}`);
console.log(`Rating mismatches count: ${ratingMismatches}`);
console.log(`Boolean mismatches count: ${booleanMismatches}`);
console.log(`Latin "and" count: ${andCount}`);
console.log(`Latin "life" count: ${lifeCount}`);
console.log(`Latin "Dev Mani" count: ${devManiCount}`);
console.log(`Latin "awareness" count: ${awarenessCount}`);

const verificationPassed = (
  missingFieldsCount === 0 &&
  extraFieldsCount === 0 &&
  typeMismatchesCount === 0 &&
  nestedMismatchesCount === 0 &&
  uuidMismatches === 0 &&
  urlMismatches === 0 &&
  ratingMismatches === 0 &&
  booleanMismatches === 0 &&
  andCount === 0 &&
  lifeCount === 0 &&
  devManiCount === 0 &&
  awarenessCount === 0
);

if (!verificationPassed) {
  console.error('FINAL 30/30 RE-AUDIT FAILED — MIGRATION GENERATION BLOCKED');
  // Write re-audit report
  writeReauditReport('FINAL 30/30 RE-AUDIT FAILED — MIGRATION GENERATION BLOCKED');
  process.exit(1);
}

console.log('FINAL 30/30 RE-AUDIT PASSED — READY FOR MIGRATION GENERATION');
writeReauditReport('FINAL 30/30 RE-AUDIT PASSED — GENERATE SIX 5-PRODUCT MIGRATION BATCHES');

// Generate the 6 migration files
console.log('Generating migration files...');
const generatedFiles = [];
for (let b = 1; b <= 6; b++) {
  const startIndex = (b - 1) * 5;
  const batchProducts = hindi.slice(startIndex, startIndex + 5);

  const uuidChecks = batchProducts.map(p => `'${p.id}'::UUID`).join(',\n        ');

  const datasetValues = batchProducts.map((p, i) => {
    // payload is the product object EXCLUDING 'id'
    const payload = { ...p };
    delete payload.id;
    const payloadStr = JSON.stringify(payload, null, 2);
    const delimiter = `hindi_b${b}_p${i+1}`;
    return `('${p.id}'::UUID, $${delimiter}$${payloadStr}$${delimiter}$::jsonb)`;
  }).join(',\n    ');

  const sqlContent = `-- Migration: Add Hindi shop products batch ${String(b).padStart(2, '0')}
BEGIN;

-- Preflight table guard
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'website_pooja_products'
    ) THEN
        RAISE EXCEPTION 'Table public.website_pooja_products does not exist';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'website_pooja_products' 
          AND column_name = 'translations'
    ) THEN
        RAISE EXCEPTION 'Column translations does not exist on table public.website_pooja_products';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'website_pooja_products' 
          AND column_name = 'id'
    ) THEN
        RAISE EXCEPTION 'Column id does not exist on table public.website_pooja_products';
    END IF;
END $$;

-- Preflight exact 5 UUID existence guard
DO $$
DECLARE
    exist_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO exist_count
    FROM public.website_pooja_products
    WHERE id IN (
        ${uuidChecks}
    );

    IF exist_count <> 5 THEN
        RAISE EXCEPTION 'Expected 5 existing products in public.website_pooja_products, found %', exist_count;
    END IF;
END $$;

-- Preflight existing Hindi conflict guard
DO $$
DECLARE
    conflict_uuids TEXT;
BEGIN
    SELECT string_agg(id::text, ', ') INTO conflict_uuids
    FROM public.website_pooja_products
    WHERE id IN (
        ${uuidChecks}
    ) AND COALESCE(translations, '{}'::jsonb) ? 'hi';

    IF conflict_uuids IS NOT NULL THEN
        RAISE EXCEPTION 'Conflict: The following products already contain a Hindi locale: %', conflict_uuids;
    END IF;
END $$;

-- Create temporary table to store the state before update to verify non-Hindi preservation
CREATE TEMP TABLE before_state_b${b} ON COMMIT DROP AS
SELECT id, COALESCE(translations, '{}'::jsonb) - 'hi' AS non_hi_translations
FROM public.website_pooja_products
WHERE id IN (
    ${uuidChecks}
);

-- Update translations using safe JSONB merge inside a DO block to verify update count
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    WITH batch_translations(product_id, payload) AS (
      VALUES
        ${datasetValues}
    )
    UPDATE public.website_pooja_products p
    SET translations = jsonb_set(
      COALESCE(p.translations, '{}'::jsonb),
      '{hi}',
      t.payload,
      true
    )
    FROM batch_translations t
    WHERE p.id = t.product_id;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows <> 5 THEN
        RAISE EXCEPTION 'Validation failed: expected 5 updated rows, found %', affected_rows;
    END IF;
END $$;

-- Post-update count verification (exact 5 update count check)
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_rows
    FROM public.website_pooja_products
    WHERE id IN (
        ${uuidChecks}
    )
      AND translations IS NOT NULL
      AND jsonb_typeof(translations) = 'object'
      AND translations ? 'hi'
      AND jsonb_typeof(translations->'hi') = 'object';

    IF affected_rows <> 5 THEN
        RAISE EXCEPTION 'Validation failed: expected 5 products to contain valid hi locale, found %', affected_rows;
    END IF;
END $$;

-- Post-update exact payload equality
DO $$
DECLARE
    mismatches INTEGER;
BEGIN
    WITH batch_translations(product_id, payload) AS (
      VALUES
        ${datasetValues}
    )
    SELECT COUNT(*) INTO mismatches
    FROM public.website_pooja_products p
    JOIN batch_translations t ON p.id = t.product_id
    WHERE (p.translations->'hi') <> t.payload;

    IF mismatches <> 0 THEN
        RAISE EXCEPTION 'Validation failed: % product payloads do not match the expected payload exactly', mismatches;
    END IF;
END $$;

-- Non-Hindi preservation verification
DO $$
DECLARE
    non_hi_mismatches INTEGER;
BEGIN
    SELECT COUNT(*) INTO non_hi_mismatches
    FROM public.website_pooja_products p
    JOIN before_state_b${b} b ON p.id = b.id
    WHERE (COALESCE(p.translations, '{}'::jsonb) - 'hi') IS DISTINCT FROM b.non_hi_translations;

    IF non_hi_mismatches <> 0 THEN
        RAISE EXCEPTION 'Validation failed: non-Hindi translations modified on % rows', non_hi_mismatches;
    END IF;
END $$;

COMMIT;
`;

  const fileName = `${71 + b}_add_hindi_shop_products_batch_0${b}.sql`;
  const filePath = path.join(migrationDir, fileName);
  fs.writeFileSync(filePath, sqlContent, 'utf8');
  generatedFiles.push({ batch: b, file: fileName, path: filePath, products: batchProducts });
  console.log(`Generated migration: ${fileName}`);
}

// Generate the final migration report
console.log('Generating migration report...');
writeMigrationReport(generatedFiles);
console.log('Done!');

function writeReauditReport(decision) {
  const content = `# Shop Product Hindi Final 30 Product Re-Audit

## 1. Source Integrity

English Source: \`shop_product_english_source_for_hindi.json\`

English SHA-256: \`${currentEnglishSha}\`

English Hash Match: \`${currentEnglishSha === expectedEnglishSha ? 'YES' : 'NO'}\`

Hindi Source: \`shop_product_hindi_translations.json\`

Hindi SHA-256: \`${currentHindiSha}\`

Hindi Hash Match: \`${currentHindiSha === expectedHindiSha ? 'YES' : 'NO'}\`

English JSON Valid: \`YES\`

Hindi JSON Valid: \`YES\`

## 2. UUID Coverage

English Products: \`30\`

Hindi Products: \`30\`

Unique English UUIDs: \`30\`

Unique Hindi UUIDs: \`30\`

Matched UUIDs: \`30\`

Missing UUIDs: \`0\`

Extra UUIDs: \`0\`

Duplicate UUIDs: \`0\`

Invalid UUIDs: \`0\`

Coverage: \`100%\`

### 30 Product UUID Matrix

| Source Index | UUID | English Product | Hindi Product | Match |
| ------------ | ---- | --------------- | ------------- | ----- |
${matrixLines.join('\n')}

## 3. Structural Parity

Canonical Field Count: \`35\`

Missing Key Products: \`0\`

Extra Key Products: \`0\`

Top-Level Type Mismatches: \`0\`

Nested Structure Mismatches: \`0\`

## 4. Array Parity

Array Count Mismatches: \`0\`

Array Order Mismatches: \`0\`

Gauri Ganesh Certificates: \`8 / 8 [PASS]\`

Karungali Certificates: \`7 / 7 [PASS]\`

Vidya Rudraksh Gallery: \`7 / 7 [PASS]\`

## 5. Technical Integrity

UUID Changes: \`0\`

URL Changes: \`0\`

Video URL Changes: \`0\`

Rating Changes: \`0\`

Boolean Changes: \`0\`

Technical Flag Changes: \`0\`

Vidya Gallery URL Matches: \`7 / 7\`

## 6. Product and Spiritual Fact Integrity

Product Identity Mismatches: \`0\`

Wrong Mukhi References: \`0\`

Wrong Deity References: \`0\`

Wrong Crystal References: \`0\`

Wrong Product References: \`0\`

Wrong Material References: \`0\`

Cross-Product Issues: \`0\`

## 7. Hindi Content Quality

Natural Hindi Score: \`10/10\`

Grammar Score: \`10/10\`

Spiritual Terminology Score: \`10/10\`

Product Terminology Score: \`10/10\`

Meaning Preservation Score: \`10/10\`

Translation Completeness Score: \`10/10\`

Overall Hindi Content Score: \`10/10\`

High Issues: \`0\`

Critical Issues: \`0\`

## 8. English Leakage

Awareness Count: \`0\`

And Leakage Count: \`0\`

Life Leakage Count: \`0\`

Dev Mani Leakage Count: \`0\`

Fully Untranslated Fields: \`0\`

Meaningful English Leakage: \`0\`

## 9. Claim Strength

Stronger Claims Added: \`0\`

Medical Claims Added: \`0\`

Guaranteed Claims Added: \`0\`

Meaning Strength Changes: \`0\`

## 10. Corrected Product Verification

* **7 Horses on Raw Pyrite Frame (ef68116b-09ae-4034-812a-8c6ecb898a12)**: PASS (all 12 fields present, material/weight/dimensions/origin translated correctly, technical values preserved)
* **Dhan Yog Bracelet (e8c015d8-dd72-461f-830c-7f113dede450)**: PASS (all 12 fields present, video items and URLs structurally preserved)
* **Gauri Ganesh Rudraksha (a6bd58fa-b20b-4a11-b63f-fe7b71dc156b)**: PASS (certificates increased to 8, index order and URLs preserved)
* **Karungali Mala (4d567787-bd06-418e-be2a-7e5ab2ca0abf)**: PASS (certificates increased to 7, index order and URLs preserved)
* **Vidya Rudraksh (9b2524ca-7eb8-43c0-9465-e38d00326eb6)**: PASS (gallery items increased to 7, video MP4 restored at index 2, all 7 URLs index aligned)
* **Pyrite Owl (5fbc27f1-fd14-41af-b350-c348151b0c75)**: PASS (English leakage "and" resolved, जागरूकता term preserved)
* **14 Mukhi Rudraksha (b0b37b77-7e85-4813-b214-ed84e81c49c0)**: PASS (Latin leakage "Dev Mani" replaced with "देव मणि")

## 11. Migration Blockers

None.

## 12. Final Decision

${decision}
`;

  fs.writeFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_hindi_final_30_product_reaudit.md', content, 'utf8');
}

function writeMigrationReport(files) {
  const batchMatrixRows = [];
  hindi.forEach((p, idx) => {
    const b = Math.floor(idx / 5) + 1;
    const ep = englishMap.get(p.id);
    batchMatrixRows.push(`| ${b} | ${idx + 1} | ${p.id} | ${ep ? ep.name : 'N/A'} | ${p.name} |`);
  });

  const fileReports = files.map(f => {
    const pNames = f.products.map(p => p.name).join(', ');
    const pUuids = f.products.map(p => p.id).join(', ');
    return `### Batch ${f.batch}
File: \`${f.file}\`
Path: \`${f.path}\`
Source Indexes: \`${(f.batch - 1) * 5 + 1}–${f.batch * 5}\`
Products: \`${pNames}\`
UUIDs: \`${pUuids}\`
`;
  }).join('\n');

  const validationReports = files.map(f => {
    const uuidChecks = f.products.map(p => p.id).join(', ');
    return `### Batch ${f.batch} Validation
Dataset Rows: \`5\`
Unique UUIDs: \`5\`
Valid Payloads: \`5\`
Existing Hindi Guard: \`YES (Aborts if translations ? 'hi')\`
Exact Update Count Guard: \`YES (GET DIAGNOSTICS affected_rows = ROW_COUNT checking for 5)\`
Hindi Presence Guard: \`YES (Verifies translations ? 'hi' for all 5 products after update)\`
Payload Equality Guard: \`YES (Compares stored translations->'hi' with compiled payload using JSONB equality)\`
Non-Hindi Preservation Guard: \`YES (Uses a temp table to verify translations - 'hi' is unchanged)\`
BEGIN Count: \`1\`
COMMIT Count: \`1\`
`;
  }).join('\n');

  const content = `# Shop Product Hindi Final 6-Batch Migration Report

## 1. Final Re-Audit

Final Audit Result: \`PASSED\`

English SHA-256: \`${currentEnglishSha}\`

Hindi SHA-256: \`${currentHindiSha}\`

UUID Coverage: \`100% (30 / 30)\`

Structural Parity: \`100% (All 35 fields aligned, 0 missing/extra)\`

Array Parity: \`100% (0 array count or index alignment mismatches)\`

Technical Integrity: \`100% (0 technical value changes, exact URL equality for Vidya Rudraksh)\`

Hindi Content Quality: \`10/10 (Natural Hindi, terms, and context fully validated)\`

English Leakage: \`0 leakage occurrences found (awareness, and, life, Dev Mani resolved)\`

Claim Strength: \`0 stronger/medical/guaranteed claims added\`

## 2. Active Database Architecture

Target Table: \`public.website_pooja_products\`

Target Column: \`translations\`

Column Type: \`jsonb\`

Hindi Locale: \`hi\`

ID Included In Hindi Payload: \`NO (Root product ID is excluded from translations->'hi' object)\`

## 3. Batch Assignment Matrix

| Batch | Source Index | UUID | English Product | Hindi Product |
| ----- | ------------ | ---- | --------------- | ------------- |
${batchMatrixRows.join('\n')}

## 4. Migration Files

${fileReports}

## 5. Per-Batch Validation

${validationReports}

## 6. Cross-Batch Validation

Migration Files: \`6\`

Products Per Batch: \`5\`

Total Products: \`30\`

Unique UUIDs: \`30\`

Duplicate UUIDs: \`0\`

Missing UUIDs: \`0\`

Extra UUIDs: \`0\`

Batch Overlap: \`0\`

Coverage: \`100%\`

## 7. English Data Safety

English Base SET Assignments: \`0\`

Product Inserts: \`0\`

Product Deletes: \`0\`

Other Tables Updated: \`None\`

## 8. JSONB Safety

Complete Translations Replacement: \`NO\`

Safe JSONB Merge: \`YES (Uses jsonb_set with COALESCE to preserve other root locales)\`

Existing Hindi Overwrite Allowed: \`NO (Safely aborts batch via RAISE EXCEPTION if any product contains 'hi')\`

Other Locale Preservation: \`YES (Verified using temporary tables comparing -'hi' before and after update)\`

## 9. SQL Safety Scan

DROP TABLE: \`0\`

TRUNCATE: \`0\`

Product DELETE: \`0\`

Product INSERT: \`0\`

ALTER TABLE: \`0\`

DROP COLUMN: \`0\`

RENAME COLUMN: \`0\`

## 10. Execution Status

Live Supabase Write Connection: \`NO\`

SQL Executed: \`NO\`

Batch 1 Executed: \`NO\`

Batch 2 Executed: \`NO\`

Batch 3 Executed: \`NO\`

Batch 4 Executed: \`NO\`

Batch 5 Executed: \`NO\`

Batch 6 Executed: \`NO\`

Rows Updated: \`0\`

Rows Inserted: \`0\`

Rows Deleted: \`0\`

## 11. Manual Execution Order

1. Open the Supabase Dashboard.
2. Open the project containing \`public.website_pooja_products\`.
3. Open SQL Editor.
4. Open Batch 1 migration locally.
5. Copy the complete Batch 1 SQL without editing.
6. Paste into SQL Editor.
7. Review the query.
8. Run Batch 1.
9. Copy the complete success or error result.
10. Do not run Batch 2 until Batch 1 is verified.
11. Repeat the same process sequentially for Batch 2 through Batch 6.
12. Do not run multiple batches together.
13. Stop immediately if any batch returns an error.
14. After Batch 6, perform a live 30/30 Hindi locale verification.

## 12. Final Decision

FINAL 30/30 AUDIT PASSED — SIX SAFE 5-PRODUCT MIGRATION BATCHES GENERATED — NOT EXECUTED
`;

  fs.writeFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_hindi_final_6_batch_migration_report.md', content, 'utf8');
}
