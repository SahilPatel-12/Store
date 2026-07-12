const fs = require('fs');
const path = require('path');

const migrationDir = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\src\\migrations';
const activeFiles = [
  '72_create_website_pooja_product_translations.sql',
  '73_add_hindi_shop_products_translations_batch_01.sql',
  '74_add_hindi_shop_products_translations_batch_02.sql',
  '75_add_hindi_shop_products_translations_batch_03.sql',
  '76_add_hindi_shop_products_translations_batch_04.sql',
  '77_add_hindi_shop_products_translations_batch_05.sql',
  '78_add_hindi_shop_products_translations_batch_06.sql'
];

console.log('--- MIGRATION INTEGRITY SAFETY AUDIT ---');

activeFiles.forEach(file => {
  const filePath = path.join(migrationDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File does not exist: ${file}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for forbidden write/alter operations on public.website_pooja_products
  const writeRegexes = [
    /\binsert\s+into\s+public\.website_pooja_products\b/i,
    /\binsert\s+into\s+website_pooja_products\b/i,
    /\bupdate\s+public\.website_pooja_products\b/i,
    /\bupdate\s+website_pooja_products\b/i,
    /\bdelete\s+from\s+public\.website_pooja_products\b/i,
    /\bdelete\s+from\s+website_pooja_products\b/i,
    /\balter\s+table\s+public\.website_pooja_products\b/i,
    /\balter\s+table\s+website_pooja_products\b/i,
    /\btruncate\s+public\.website_pooja_products\b/i,
    /\btruncate\s+website_pooja_products\b/i,
    /\bdrop\s+table\s+public\.website_pooja_products\b/i,
    /\bdrop\s+table\s+website_pooja_products\b/i,
    /\bmerge\s+into\s+public\.website_pooja_products\b/i,
    /\bmerge\s+into\s+website_pooja_products\b/i
  ];

  writeRegexes.forEach((regex, index) => {
    if (regex.test(content)) {
      console.error(`FORBIDDEN OPERATION DETECTED in ${file} with regex index ${index}`);
      process.exit(1);
    }
  });

  // Verify that all insertions target the translations table
  // Look for "INSERT INTO" and check the target table name.
  // Note: in our scripts, the INSERT INTO statement is: "INSERT INTO public.website_pooja_product_translations"
  // Let's verify that any INSERT INTO targets ONLY website_pooja_product_translations
  const insertMatches = content.match(/\binsert\s+into\s+([^\s(]+)/ig);
  if (insertMatches) {
    insertMatches.forEach(m => {
      const cleaned = m.replace(/\s+/g, ' ').toLowerCase();
      if (!cleaned.includes('website_pooja_product_translations')) {
        console.error(`FORBIDDEN INSERT TARGET in ${file}: ${m}`);
        process.exit(1);
      }
    });
  }

  // Verify no jsonb_set targeting website_pooja_products
  if (/\bjsonb_set\b/i.test(content) && !file.includes('72_')) {
    console.error(`FORBIDDEN jsonb_set DETECTED in ${file}`);
    process.exit(1);
  }
});

console.log('SAFETY CHECKS PASSED: public.website_pooja_products has 0 writes and 0 schema modifications across all files.');
