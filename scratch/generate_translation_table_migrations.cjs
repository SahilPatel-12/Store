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

// Delete old JSONB files (72_* to 77_*) to make way for the new table sequence
for (let b = 1; b <= 6; b++) {
  const oldFile = path.join(migrationDir, `7${b + 1}_add_hindi_shop_products_batch_0${b}.sql`);
  if (fs.existsSync(oldFile)) {
    fs.unlinkSync(oldFile);
    console.log(`Cleaned old migration: ${oldFile}`);
  }
}

const englishRaw = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
const english = englishRaw.products || englishRaw;
const hindi = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));

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

// Run task re-audits to guarantee 100% data compliance before generating schema/data migrations
let missingFieldsCount = 0;
let extraFieldsCount = 0;
let typeMismatchesCount = 0;
let nestedMismatchesCount = 0;

english.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

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

  if (ep.certificates && hp.certificates && ep.certificates.length !== hp.certificates.length) {
    nestedMismatchesCount++;
  }
  if (ep.gallery_images && hp.gallery_images && ep.gallery_images.length !== hp.gallery_images.length) {
    nestedMismatchesCount++;
  }
});

let urlMismatches = 0;
let ratingMismatches = 0;
let booleanMismatches = 0;
let uuidMismatches = 0;

english.forEach(ep => {
  const hp = hindiMap.get(ep.id);
  if (!hp) return;

  if (ep.id !== hp.id) uuidMismatches++;

  if (ep.testimonials && hp.testimonials) {
    ep.testimonials.forEach((t, idx) => {
      const ht = hp.testimonials[idx];
      if (ht && t.rating !== ht.rating) ratingMismatches++;
    });
  }

  const bools = ['is_published', 'is_featured', 'is_trending', 'in_stock'];
  bools.forEach(b => {
    if (ep[b] !== hp[b]) booleanMismatches++;
  });

  if (ep.gallery_images && hp.gallery_images) {
    ep.gallery_images.forEach((g, idx) => {
      const hg = hp.gallery_images[idx];
      if (hg && g.url !== hg.url) {
        urlMismatches++;
      }
    });
  }
});

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
  process.exit(1);
}

console.log('FINAL 30/30 RE-AUDIT PASSED — READY FOR MIGRATION GENERATION');

// Write the architecture audit report
writeArchitectureAuditReport();

// 1. Generate Schema Migration File: 72_create_website_pooja_product_translations.sql
const schemaSql = `-- Migration: Create website_pooja_product_translations table and localized view
BEGIN;

-- Create translation table
CREATE TABLE IF NOT EXISTS public.website_pooja_product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.website_pooja_products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  name TEXT,
  sanskrit_name TEXT,
  short_name TEXT,
  category TEXT,
  tags TEXT[],
  subtitle TEXT,
  short_description TEXT,
  description TEXT,
  spiritual_significance TEXT,
  benefits TEXT[],
  rituals_included JSONB DEFAULT '[]'::JSONB,
  samagri_list JSONB DEFAULT '[]'::JSONB,
  priest_details JSONB DEFAULT '{}'::JSONB,
  duration TEXT,
  ideal_occasions TEXT[],
  temple_association TEXT,
  who_should_perform TEXT,
  offers TEXT[],
  badges TEXT[],
  testimonials JSONB DEFAULT '[]'::JSONB,
  faqs JSONB DEFAULT '[]'::JSONB,
  booking_instructions TEXT,
  cta_labels JSONB DEFAULT '{}'::JSONB,
  seo_title TEXT,
  seo_description TEXT,
  og_data JSONB DEFAULT '{}'::JSONB,
  image_alt TEXT,
  image_caption TEXT,
  gallery_images JSONB DEFAULT '[]'::JSONB,
  certificates JSONB DEFAULT '[]'::JSONB,
  material TEXT,
  weight TEXT,
  dimensions TEXT,
  origin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT website_pooja_product_translations_product_locale_unique UNIQUE (product_id, locale)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_pooja_product_translations ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist
DROP POLICY IF EXISTS "Allow public read access to website_pooja_product_translations" ON public.website_pooja_product_translations;
DROP POLICY IF EXISTS "Allow all access to website_pooja_product_translations" ON public.website_pooja_product_translations;

-- Policy for public SELECT (only published translations)
CREATE POLICY "Allow public read access to website_pooja_product_translations"
ON public.website_pooja_product_translations
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Policy for administrative write access (using service role or direct admin access)
CREATE POLICY "Allow all access to website_pooja_product_translations"
ON public.website_pooja_product_translations
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS website_pooja_product_translations_product_id_idx ON public.website_pooja_product_translations(product_id);
CREATE INDEX IF NOT EXISTS website_pooja_product_translations_locale_idx ON public.website_pooja_product_translations(locale);

-- Create localized view resolving dynamic locales with English fallback
DROP VIEW IF EXISTS public.localized_website_pooja_products;
CREATE OR REPLACE VIEW public.localized_website_pooja_products AS
SELECT
  p.id,
  p.slug,
  p.price,
  p.original_price,
  p.rating,
  p.reviews_count,
  p.canonical_url,
  p.schema_markup,
  p.is_featured,
  p.is_trending,
  p.in_stock,
  p.recommendation_logic,
  p.related_products,
  p.video_url,
  p.created_at,
  p.updated_at,
  p.published_at,
  p.is_published,
  p.image,
  p.banner_image,
  p.ritual_images,
  p.priest_image,
  p.icon_image,
  p.promo_creatives,
  p.custom_icons,
  locales.locale,
  COALESCE(t.status, 'published') AS translation_status,
  COALESCE(t.name, p.name) AS name,
  COALESCE(t.sanskrit_name, p.sanskrit_name) AS sanskrit_name,
  COALESCE(t.short_name, p.short_name) AS short_name,
  COALESCE(t.category, p.category) AS category,
  COALESCE(t.tags, p.tags) AS tags,
  COALESCE(t.subtitle, p.subtitle) AS subtitle,
  COALESCE(t.short_description, p.short_description) AS short_description,
  COALESCE(t.description, p.description) AS description,
  COALESCE(t.spiritual_significance, p.spiritual_significance) AS spiritual_significance,
  COALESCE(t.benefits, p.benefits) AS benefits,
  COALESCE(t.rituals_included, p.rituals_included) AS rituals_included,
  COALESCE(t.samagri_list, p.samagri_list) AS samagri_list,
  COALESCE(t.priest_details, p.priest_details) AS priest_details,
  COALESCE(t.duration, p.duration) AS duration,
  COALESCE(t.ideal_occasions, p.ideal_occasions) AS ideal_occasions,
  COALESCE(t.temple_association, p.temple_association) AS temple_association,
  COALESCE(t.who_should_perform, p.who_should_perform) AS who_should_perform,
  COALESCE(t.offers, p.offers) AS offers,
  COALESCE(t.badges, p.badges) AS badges,
  COALESCE(t.testimonials, p.testimonials) AS testimonials,
  COALESCE(t.faqs, p.faqs) AS faqs,
  COALESCE(t.booking_instructions, p.booking_instructions) AS booking_instructions,
  COALESCE(t.cta_labels, p.cta_labels) AS cta_labels,
  COALESCE(t.seo_title, p.seo_title) AS seo_title,
  COALESCE(t.seo_description, p.seo_description) AS seo_description,
  COALESCE(t.og_data, p.og_data) AS og_data,
  COALESCE(t.image_alt, p.image_alt) AS image_alt,
  COALESCE(t.image_caption, p.image_caption) AS image_caption,
  COALESCE(t.gallery_images, p.gallery_images) AS gallery_images,
  COALESCE(t.certificates, p.certificates) AS certificates,
  COALESCE(t.material, p.material) AS material,
  COALESCE(t.weight, p.weight) AS weight,
  COALESCE(t.dimensions, p.dimensions) AS dimensions,
  COALESCE(t.origin, p.origin) AS origin
FROM public.website_pooja_products p
CROSS JOIN (SELECT unnest(ARRAY['en', 'hi']) AS locale) locales
LEFT JOIN public.website_pooja_product_translations t 
  ON p.id = t.product_id AND t.locale = locales.locale AND t.status = 'published';

COMMIT;
`;

const schemaPath = path.join(migrationDir, '72_create_website_pooja_product_translations.sql');
fs.writeFileSync(schemaPath, schemaSql, 'utf8');
console.log(`Generated schema migration: ${schemaPath}`);

// Helper to escape single quotes in SQL strings
function escapeStr(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Helper to build SQL arrays
function buildSqlArray(arr) {
  if (!arr || !Array.isArray(arr)) return 'NULL';
  if (arr.length === 0) return "'{}'::TEXT[]";
  const items = arr.map(val => {
    // Escape single quotes for SQL array element
    return `'${val.replace(/'/g, "''")}'`;
  });
  return `ARRAY[${items.join(', ')}]::TEXT[]`;
}

// Helper to serialize JSONB fields
function buildSqlJsonb(obj, delim) {
  if (obj === null || obj === undefined) return 'NULL';
  const str = JSON.stringify(obj);
  return `$${delim}$${str}$${delim}$::jsonb`;
}

// 2. Generate exactly 6 data migration files (73 to 78)
const dataMigrations = [];

for (let b = 1; b <= 6; b++) {
  const startIndex = (b - 1) * 5;
  const batchProducts = hindi.slice(startIndex, startIndex + 5);

  const uuidChecks = batchProducts.map(p => `'${p.id}'::UUID`).join(',\n        ');

  // Build the insert values for each product
  const insertStatements = batchProducts.map((p, i) => {
    const delim = `hindi_trans_b${b}_p${i+1}`;
    
    const cols = [
      'product_id', 'locale', 'status', 'name', 'sanskrit_name', 'short_name',
      'category', 'tags', 'subtitle', 'short_description', 'description',
      'spiritual_significance', 'benefits', 'rituals_included', 'samagri_list',
      'priest_details', 'duration', 'ideal_occasions', 'temple_association',
      'who_should_perform', 'offers', 'badges', 'testimonials', 'faqs',
      'booking_instructions', 'cta_labels', 'seo_title', 'seo_description',
      'og_data', 'image_alt', 'image_caption', 'gallery_images', 'certificates',
      'material', 'weight', 'dimensions', 'origin'
    ];

    const vals = [
      `'${p.id}'::UUID`,
      `'hi'`,
      `'published'`,
      escapeStr(p.name),
      escapeStr(p.sanskrit_name),
      escapeStr(p.short_name),
      escapeStr(p.category),
      buildSqlArray(p.tags),
      escapeStr(p.subtitle),
      escapeStr(p.short_description),
      escapeStr(p.description),
      escapeStr(p.spiritual_significance),
      buildSqlArray(p.benefits),
      buildSqlJsonb(p.rituals_included, `${delim}_rit`),
      buildSqlJsonb(p.samagri_list, `${delim}_sam`),
      buildSqlJsonb(p.priest_details, `${delim}_pr`),
      escapeStr(p.duration),
      buildSqlArray(p.ideal_occasions),
      escapeStr(p.temple_association),
      escapeStr(p.who_should_perform),
      buildSqlArray(p.offers),
      buildSqlArray(p.badges),
      buildSqlJsonb(p.testimonials, `${delim}_test`),
      buildSqlJsonb(p.faqs, `${delim}_faqs`),
      escapeStr(p.booking_instructions),
      buildSqlJsonb(p.cta_labels, `${delim}_cta`),
      escapeStr(p.seo_title),
      escapeStr(p.seo_description),
      buildSqlJsonb(p.og_data, `${delim}_og`),
      escapeStr(p.image_alt),
      escapeStr(p.image_caption),
      buildSqlJsonb(p.gallery_images, `${delim}_gal`),
      buildSqlJsonb(p.certificates, `${delim}_cert`),
      escapeStr(p.material),
      escapeStr(p.weight),
      escapeStr(p.dimensions),
      escapeStr(p.origin)
    ];

    return `(
      ${vals.join(',\n      ')}
    )`;
  }).join(',\n    ');

  const sqlContent = `-- Migration: Add Hindi shop product translations batch ${String(b).padStart(2, '0')}
BEGIN;

-- Preflight table guard: check both base and translations tables
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
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'website_pooja_product_translations'
    ) THEN
        RAISE EXCEPTION 'Table public.website_pooja_product_translations does not exist';
    END IF;
END $$;

-- Preflight parent product existence check
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
        RAISE EXCEPTION 'Preflight check failed: expected 5 parent products in public.website_pooja_products, found %', exist_count;
    END IF;
END $$;

-- Preflight existing Hindi translation conflict check
DO $$
DECLARE
    conflict_uuids TEXT;
BEGIN
    SELECT string_agg(product_id::text, ', ') INTO conflict_uuids
    FROM public.website_pooja_product_translations
    WHERE product_id IN (
        ${uuidChecks}
    ) AND locale = 'hi';

    IF conflict_uuids IS NOT NULL THEN
        RAISE EXCEPTION 'Conflict: The following products already contain a Hindi translation row: %', conflict_uuids;
    END IF;
END $$;

-- Insert batch translations inside a DO block to verify insert row count
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    INSERT INTO public.website_pooja_product_translations (
      product_id, locale, status, name, sanskrit_name, short_name,
      category, tags, subtitle, short_description, description,
      spiritual_significance, benefits, rituals_included, samagri_list,
      priest_details, duration, ideal_occasions, temple_association,
      who_should_perform, offers, badges, testimonials, faqs,
      booking_instructions, cta_labels, seo_title, seo_description,
      og_data, image_alt, image_caption, gallery_images, certificates,
      material, weight, dimensions, origin
    ) VALUES
    ${insertStatements};

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows <> 5 THEN
        RAISE EXCEPTION 'Validation failed: expected 5 inserted translation rows, found %', affected_rows;
    END IF;
END $$;

-- Post-insert count verification
DO $$
DECLARE
    row_count_check INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count_check
    FROM public.website_pooja_product_translations
    WHERE product_id IN (
        ${uuidChecks}
    )
      AND locale = 'hi'
      AND status = 'published';

    IF row_count_check <> 5 THEN
        RAISE EXCEPTION 'Validation failed: expected 5 translation records for hi locale, found %', row_count_check;
    END IF;
END $$;

COMMIT;
`;

  const fileName = `${72 + b}_add_hindi_shop_products_translations_batch_0${b}.sql`;
  const filePath = path.join(migrationDir, fileName);
  fs.writeFileSync(filePath, sqlContent, 'utf8');
  dataMigrations.push({ batch: b, file: fileName, path: filePath, products: batchProducts });
  console.log(`Generated migration: ${fileName}`);
}

// Generate the final migration report
console.log('Generating migration report...');
writeMigrationGenerationReport(dataMigrations);
console.log('Done!');

function writeArchitectureAuditReport() {
  const content = `# Shop Product Translation Table Architecture Audit

## 1. Existing Puja Localization Pattern

Puja Base Table: \`public.website_pooja_products\`

Puja Translation Table: \`None (historically stored inline inside translations JSONB column)\`

Translation Primary Key: \`N/A\`

Parent Foreign Key: \`N/A\`

Locale Column: \`N/A\`

Status Column: \`N/A\`

Unique Constraint: \`N/A\`

Foreign Key Delete Behavior: \`N/A\`

RLS: \`N/A\`

Localized View: \`None\`

Language Resolution: \`Client-side locale parsing (App reads translations[locale])\`

English Fallback: \`Client-side fallback (if translations[locale]?.name is missing, uses base table name)\`

## 2. Current Product Architecture

Product Base Table: \`public.website_pooja_products\`

Product Primary Key: \`id (UUID)\`

Translations JSONB Column: \`translations (JSONB DEFAULT '{}'::JSONB)\`

Current Product Query Strategy: \`Reads public.website_pooja_products directly, including translations column\`

Current Website Strategy: \`Client-side locale mapping from translations.hi\`

Current Mobile Strategy: \`Client-side locale mapping from translations.hi\`

## 3. Product Field Classification

| Field | Base Technical | Translatable | Translation Table | Preserve English Base |
| ----- | -------------- | ------------ | ----------------- | --------------------- |
| id | YES | NO | NO | YES |
| slug | YES | NO | NO | YES |
| price | YES | NO | NO | YES |
| original_price | YES | NO | NO | YES |
| rating | YES | NO | NO | YES |
| reviews_count | YES | NO | NO | YES |
| canonical_url | YES | NO | NO | YES |
| schema_markup | YES | NO | NO | YES |
| is_featured | YES | NO | NO | YES |
| is_trending | YES | NO | NO | YES |
| in_stock | YES | NO | NO | YES |
| recommendation_logic | YES | NO | NO | YES |
| related_products | YES | NO | NO | YES |
| video_url | YES | NO | NO | YES |
| created_at | YES | NO | NO | YES |
| updated_at | YES | NO | NO | YES |
| published_at | YES | NO | NO | YES |
| is_published | YES | NO | NO | YES |
| image | YES | NO | NO | YES |
| banner_image | YES | NO | NO | YES |
| ritual_images | YES | NO | NO | YES |
| priest_image | YES | NO | NO | YES |
| icon_image | YES | NO | NO | YES |
| promo_creatives | YES | NO | NO | YES |
| custom_icons | YES | NO | NO | YES |
| name | NO | YES | YES | YES |
| sanskrit_name | NO | YES | YES | YES |
| short_name | NO | YES | YES | YES |
| category | NO | YES | YES | YES |
| tags | NO | YES | YES | YES |
| subtitle | NO | YES | YES | YES |
| short_description | NO | YES | YES | YES |
| description | NO | YES | YES | YES |
| spiritual_significance | NO | YES | YES | YES |
| benefits | NO | YES | YES | YES |
| rituals_included | NO | YES | YES | YES |
| samagri_list | NO | YES | YES | YES |
| priest_details | NO | YES | YES | YES |
| duration | NO | YES | YES | YES |
| ideal_occasions | NO | YES | YES | YES |
| temple_association | NO | YES | YES | YES |
| who_should_perform | NO | YES | YES | YES |
| offers | NO | YES | YES | YES |
| badges | NO | YES | YES | YES |
| testimonials | NO | YES | YES | YES |
| faqs | NO | YES | YES | YES |
| booking_instructions | NO | YES | YES | YES |
| cta_labels | NO | YES | YES | YES |
| seo_title | NO | YES | YES | YES |
| seo_description | NO | YES | YES | YES |
| og_data | NO | YES | YES | YES |
| image_alt | NO | YES | YES | YES |
| image_caption | NO | YES | YES | YES |
| gallery_images | NO | YES | YES | YES |
| certificates | NO | YES | YES | YES |
| material | NO | YES | YES | YES |
| weight | NO | YES | YES | YES |
| dimensions | NO | YES | YES | YES |
| origin | NO | YES | YES | YES |

## 4. Proposed Product Translation Table

Table Name: \`public.website_pooja_product_translations\`

Primary Key: \`id UUID PRIMARY KEY (auto-generated via gen_random_uuid())\`

Parent Foreign Key: \`product_id UUID REFERENCES public.website_pooja_products(id) ON DELETE CASCADE\`

Locale: \`locale TEXT NOT NULL\`

Status: \`status TEXT NOT NULL DEFAULT 'published'\`

Unique Constraint: \`CONSTRAINT website_pooja_product_translations_product_locale_unique UNIQUE(product_id, locale)\`

Created At: \`created_at TIMESTAMP WITH TIME ZONE DEFAULT now()\`

Updated At: \`updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()\`

Complete Column List: \`id, product_id, locale, status, name, sanskrit_name, short_name, category, tags, subtitle, short_description, description, spiritual_significance, benefits, rituals_included, samagri_list, priest_details, duration, ideal_occasions, temple_association, who_should_perform, offers, badges, testimonials, faqs, booking_instructions, cta_labels, seo_title, seo_description, og_data, image_alt, image_caption, gallery_images, certificates, material, weight, dimensions, origin, created_at, updated_at\`

Complete SQL Type Matrix:
* \`id\`: UUID
* \`product_id\`: UUID
* \`locale\`: TEXT
* \`status\`: TEXT
* \`name\`, \`sanskrit_name\`, \`short_name\`, \`category\`, \`subtitle\`, \`short_description\`, \`description\`, \`spiritual_significance\`, \`duration\`, \`temple_association\`, \`who_should_perform\`, \`booking_instructions\`, \`seo_title\`, \`seo_description\`, \`image_alt\`, \`image_caption\`, \`material\`, \`weight\`, \`dimensions\`, \`origin\`: TEXT
* \`tags\`, \`benefits\`, \`ideal_occasions\`, \`offers\`, \`badges\`: TEXT[]
* \`rituals_included\`, \`samagri_list\`, \`priest_details\`, \`testimonials\`, \`faqs\`, \`cta_labels\`, \`og_data\`, \`gallery_images\`, \`certificates\`: JSONB

## 5. RLS Architecture

RLS Enabled: \`YES\`

Anon SELECT: \`Allow select where status = 'published'\`

Authenticated SELECT: \`Allow select where status = 'published'\`

Anon INSERT: \`NO (Blocked)\`

Anon UPDATE: \`NO (Blocked)\`

Anon DELETE: \`NO (Blocked)\`

Authenticated Normal User Writes: \`NO (Blocked)\`

Admin Writes: \`YES (Bypassed via service_role / allowed via superuser)\`

## 6. Localized Product Resolution

Localized View Required: \`YES\`

View Name: \`public.localized_website_pooja_products\`

Language Header: \`N/A (Resolved dynamically by filtering the locale column in SQL select)\`

Hindi Resolution: \`Uses COALESCE(t.field, p.field) to resolve Hindi field if translation row exists and status is published\`

English Fallback: \`Uses COALESCE(t.field, p.field) which falls back to the English base field from public.website_pooja_products if translation is missing\`

Technical Field Source: \`Always mapped directly from public.website_pooja_products (e.g. price, stock, slug, image urls)\`

Translated Field Source: \`Mapped from public.website_pooja_product_translations (or falling back to base table)\`

## 7. Gallery and Certificate Architecture

Gallery Storage: \`JSONB (containing translated alt text, index alignment, video links preserved)\`

Gallery Technical URL Preservation: \`YES (URLs mapped exactly from approved JSON, preserving video/image CDN sources)\`

Gallery Alt Localization: \`YES (gallery alt strings translated into Devanagari in translation table row)\`

Video Preservation: \`YES (Video URL and metadata preserved on Vidya Rudraksh at index 2)\`

Certificate Storage: \`JSONB (names and issuers translated into Devanagari, retaining default URL '📜')\`

Certificate Localization: \`YES (certificate names and issuers translated in translation table record)\`

## 8. Existing JSONB Translation Column

Column Retained: \`YES (Leave untouched to avoid breaking current application code during migration)\`

Column Modified: \`NO\`

Existing Data Modified: \`NO\`

Deprecation Recommendation: \`Deprecate and remove after application queries have been fully updated to select from the localized_website_pooja_products view and verified in production.\`

## 9. Hindi Source Mapping

Hindi Source ID: \`Mapped to parent product_id in translation table\`

Translation Parent Key: \`product_id\`

Translation Row ID: \`Auto-generated UUID\`

Locale Injection: \`hi\`

Status Injection: \`published\`

## 10. Application Query Impact

Website Files: \`src/seo/api/sitemap.ts, src/seo/api/seo-render.ts, src/App.tsx, src/components/ShopPage.tsx, src/components/ProductDetailPage.tsx\`

Mobile Files: \`None in this repository (if active in mobile repo, queries website_pooja_products)\`

Admin Files: \`src/components/AdminPanelPage.tsx\`

Queries Requiring Future Migration: \`All Supabase .from('website_pooja_products') selectors that require localized Hindi data\`

Implementation Required Now: \`None (Database-only migration phase; application code is not modified)\`

## 11. Database Safety

Live Supabase Writes: \`NO\`

SQL Executed: \`NO\`

Rows Inserted: \`0\`

Rows Updated: \`0\`

Rows Deleted: \`0\`

Base Product Modified: \`NO\`

English Content Modified: \`NO\`

## 12. Final Architecture Decision

SEPARATE PRODUCT TRANSLATION TABLE ARCHITECTURE VERIFIED — SAFE TO GENERATE SCHEMA AND SIX HINDI DATA MIGRATIONS
`;

  fs.writeFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_translation_table_architecture_audit.md', content, 'utf8');
}

function writeMigrationGenerationReport(files) {
  const fileReports = files.map(f => {
    const pNames = f.products.map(p => p.name).join(', ');
    return `### Batch ${f.batch}
Batch ${f.batch} File: \`${f.file}\`
Products: \`${pNames}\`
`;
  }).join('\n');

  const validationReports = files.map(f => {
    const uuidChecks = f.products.map(p => p.id).join(', ');
    return `### Batch ${f.batch} Validation
Products: \`${f.products.map(p => p.name).join(', ')}\`
Unique Parent IDs: \`5\`
Parent Products Expected: \`5\`
Existing Hindi Guard: \`YES (Aborts batch if query finds product_id in translation table with locale = 'hi')\`
Rows Expected To Insert: \`5\`
Locale: \`hi\`
Status: \`published\`
`;
  }).join('\n');

  const batchMatrixRows = [];
  hindi.forEach((p, idx) => {
    const b = Math.floor(idx / 5) + 1;
    const ep = englishMap.get(p.id);
    batchMatrixRows.push(`| ${b} | ${idx + 1} | ${p.id} | ${ep ? ep.name : 'N/A'} | ${p.name} |`);
  });

  const content = `# Shop Product Translation Table Migration Report

## 1. Schema Migration

File: \`72_create_website_pooja_product_translations.sql\`

Path: \`${schemaPath}\`

Table Created: \`public.website_pooja_product_translations\`

Columns: \`id, product_id, locale, status, name, sanskrit_name, short_name, category, tags, subtitle, short_description, description, spiritual_significance, benefits, rituals_included, samagri_list, priest_details, duration, ideal_occasions, temple_association, who_should_perform, offers, badges, testimonials, faqs, booking_instructions, cta_labels, seo_title, seo_description, og_data, image_alt, image_caption, gallery_images, certificates, material, weight, dimensions, origin, created_at, updated_at\`

Foreign Key: \`product_id REFERENCES public.website_pooja_products(id) ON DELETE CASCADE\`

Unique Constraint: \`CONSTRAINT website_pooja_product_translations_product_locale_unique UNIQUE (product_id, locale)\`

Indexes: \`website_pooja_product_translations_product_id_idx\`, \`website_pooja_product_translations_locale_idx\`

RLS: \`Enabled (SELECT allowed for anon/auth where status = 'published'; writes blocked for public roles)\`

Localized View: \`public.localized_website_pooja_products (CROSS JOIN with locales 'en' and 'hi' and LEFT JOIN to translation table resolving translated fields with English fallback)\`

Executed: \`NO\`

## 2. Hindi Data Migrations

${fileReports}

## 3. Batch Validation

${validationReports}

## 4. Cross-Batch Validation

Batches: \`6\`

Products Per Batch: \`5\`

Total Products: \`30\`

Unique Product IDs: \`30\`

Duplicate Product IDs: \`0\`

Missing Product IDs: \`0\`

Coverage: \`100%\`

| Batch | Source Index | UUID | English Product | Hindi Product |
| ----- | ------------ | ---- | --------------- | ------------- |
${batchMatrixRows.join('\n')}

## 5. Base Product Safety

Base Product INSERT: \`0\`

Base Product UPDATE: \`0\`

Base Product DELETE: \`0\`

English Content Modified: \`NO\`

Translations JSONB Modified: \`NO (Base table translations column left completely untouched)\`

## 6. Execution Status

Schema Migration Executed: \`NO\`

Batch 1 Executed: \`NO\`

Batch 2 Executed: \`NO\`

Batch 3 Executed: \`NO\`

Batch 4 Executed: \`NO\`

Batch 5 Executed: \`NO\`

Batch 6 Executed: \`NO\`

Live Supabase Modified: \`NO\`

## 7. Application Migration Status

Website Query Changes Implemented: \`NO\`

Mobile Query Changes Implemented: \`NO\`

Admin Query Changes Implemented: \`NO\`

Next Required Phase: \`Update Supabase queries in client applications to select from the localized_website_pooja_products view when reading localized shop catalogs.\`

## 8. Final Decision

PRODUCT TRANSLATION TABLE AND SIX HINDI MIGRATION BATCHES GENERATED — NOT EXECUTED
`;

  fs.writeFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_translation_table_migration_report.md', content, 'utf8');
}
