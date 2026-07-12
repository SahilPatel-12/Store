const fs = require('fs');
const english = JSON.parse(fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json', 'utf-8')).products;
const hindi = JSON.parse(fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json', 'utf-8'));

console.log('--- ENGLISH ---');
english.forEach(p => {
  if (p.name.includes('Mukhi')) {
    console.log(`${p.name} -> ID: ${p.id}`);
  }
});

console.log('--- HINDI ---');
hindi.forEach(p => {
  if (p.name.includes('मुखी')) {
    console.log(`${p.name} -> ID: ${p.id}`);
  }
});
