const fs = require('fs');

const english = JSON.parse(fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json', 'utf-8')).products;
const hindi = JSON.parse(fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json', 'utf-8'));

const ep = english.find(p => p.id === '4d567787-bd06-418e-be2a-7e5ab2ca0abf');
const hp = hindi.find(p => p.id === '4d567787-bd06-418e-be2a-7e5ab2ca0abf');

console.log('--- ENGLISH CERTIFICATES ---');
console.log(ep.certificates);

console.log('\n--- HINDI CERTIFICATES ---');
console.log(hp.certificates);
