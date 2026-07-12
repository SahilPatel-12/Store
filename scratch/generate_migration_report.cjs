const fs = require('fs');
const crypto = require('crypto');

const englishPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json';
const hindiPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json';
const outputPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_hindi_6_batch_migration_report.md';

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

const batchRows = [];
hindiData.forEach((hp, idx) => {
  const batchNum = Math.floor(idx / 5) + 1;
  const ep = englishMap.get(hp.id);
  const engName = ep ? ep.name : 'UNKNOWN';
  batchRows.push(`| ${batchNum} | ${idx + 1} | ${hp.id} | ${engName} | ${hp.name} |`);
});

const report = `# Shop Product Hindi 6-Batch Migration Generation Report

## 1. Final Audit Decision

Final Content Audit: \`FAILED\`

Migration Generation Allowed: \`NO\`

English Source SHA-256: \`${englishSha}\`

Hindi Source SHA-256: \`${hindiSha}\`

## 2. Database Architecture

Target Table: \`public.website_pooja_products\`

Target Column: \`translations\`

Column Type: \`JSONB\`

Hindi Locale Key: \`hi\`

Translation Contract:
\`\`\`json
{
  "hi": {
    "name": "...",
    "description": "...",
    "benefits": [],
    "rituals_included": [],
    "priest_details": {},
    "certificates": []
  }
}
\`\`\`

## 3. Batch Assignment Matrix

| Batch | Source Index | UUID | English Product | Hindi Product |
| ----- | ------------ | ---- | --------------- | ------------- |
${batchRows.join('\n')}

## 4. Migration Files

### Batch 1
File: \`None\`
Path: \`None\`
Products: \`None\`
UUIDs: \`None\`

### Batch 2
File: \`None\`
Path: \`None\`
Products: \`None\`
UUIDs: \`None\`

### Batch 3
File: \`None\`
Path: \`None\`
Products: \`None\`
UUIDs: \`None\`

### Batch 4
File: \`None\`
Path: \`None\`
Products: \`None\`
UUIDs: \`None\`

### Batch 5
File: \`None\`
Path: \`None\`
Products: \`None\`
UUIDs: \`None\`

### Batch 6
File: \`None\`
Path: \`None\`
Products: \`None\`
UUIDs: \`None\`

## 5. Per-Batch Validation

### Batch 1 Validation
* Product Count: 0
* Unique UUID Count: 0
* Payload Count: 0
* Valid JSON Payload Count: 0
* BEGIN Count: 0
* COMMIT Count: 0
* Expected Update Count: 0
* Existing Hindi Guard: N/A
* Payload Equality Guard: N/A
* Non-Hindi Preservation Strategy: N/A
* DROP TABLE Count: 0
* TRUNCATE Count: 0
* Product DELETE Count: 0
* Product INSERT Count: 0
* ALTER TABLE Count: 0
* SET English Base Column Count: 0

### Batch 2 Validation
* (All counts 0 / blocked)

### Batch 3 Validation
* (All counts 0 / blocked)

### Batch 4 Validation
* (All counts 0 / blocked)

### Batch 5 Validation
* (All counts 0 / blocked)

### Batch 6 Validation
* (All counts 0 / blocked)

## 6. Cross-Batch Validation

Batch Files: \`0\`

Total Products: \`0\`

Unique UUIDs: \`0\`

Duplicate UUIDs: \`0\`

Missing UUIDs: \`30\` (Generation blocked)

Extra UUIDs: \`0\`

Batch Overlap: \`0\`

Coverage: \`0%\`

## 7. English Data Preservation

English Base Columns Updated: \`0\`

English Product Rows Inserted: \`0\`

English Product Rows Deleted: \`0\`

Other Tables Modified: \`None\`

## 8. JSONB Preservation

Existing Hindi Conflict Guard: \`N/A\`

Other Locale Preservation: \`N/A\`

Complete Translations Replacement Used: \`NO\`

Safe JSONB Merge Used: \`NO\`

## 9. SQL Safety Scan

DROP TABLE: \`0\`

TRUNCATE: \`0\`

Product DELETE: \`0\`

Product INSERT: \`0\`

ALTER TABLE: \`0\`

DROP COLUMN: \`0\`

English Base SET Assignments: \`0\`

## 10. Execution Status

Live Supabase Connected For Writes: \`NO\`

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

## 11. Manual Execution Order For Sahil

1. Run Batch 1.
2. Copy the complete Supabase result.
3. Verify success before Batch 2.
4. Run Batch 2.
5. Verify success before Batch 3.
6. Run Batch 3.
7. Verify success before Batch 4.
8. Run Batch 4.
9. Verify success before Batch 5.
10. Run Batch 5.
11. Verify success before Batch 6.
12. Run Batch 6.
13. Perform final 30/30 live Hindi verification.

**Note to Sahil:**
* Do not run all six batches at once.
* Do not continue to the next batch if the current batch reports an error.
* Do not edit SQL manually in Supabase SQL Editor.
* Currently, migration generation is blocked because Phase 1 Final Hindi Content Audit failed due to structural mismatches and array integrity issues in 5 products. Do not proceed until Hindi source translations are corrected.

## 12. Final Decision

MIGRATION GENERATION BLOCKED — FINAL AUDIT FAILED
`;

fs.writeFileSync(outputPath, report, 'utf8');
console.log('Migration generation report written successfully!');
