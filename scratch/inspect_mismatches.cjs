const fs = require('fs');

const englishPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json';
const hindiPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json';

const english = JSON.parse(fs.readFileSync(englishPath, 'utf-8')).products;
const hindi = JSON.parse(fs.readFileSync(hindiPath, 'utf-8'));

const englishMap = new Map(english.map(p => [p.id, p]));
const hindiMap = new Map(hindi.map(p => [p.id, p]));

console.log('--- INSPECTING BLACK HORSESHOE ---');
const bhId = '1fe03faa-3042-492d-b977-d536548cf0e2';
const bhEp = englishMap.get(bhId);
const bhHp = hindiMap.get(bhId);
console.log('English weight:', bhEp.weight);
console.log('Hindi weight:', bhHp.weight);
console.log('English dimensions:', bhEp.dimensions);
console.log('Hindi dimensions:', bhHp.dimensions);

console.log('\n--- INSPECTING GAURI GANESH RUDRAKSHA CERTIFICATES ---');
const ggId = 'a6bd58fa-b20b-4a11-b63f-fe7b71dc156b';
const ggEp = englishMap.get(ggId);
const ggHp = hindiMap.get(ggId);
console.log('English certificates count:', ggEp.certificates.length, ggEp.certificates.map(c => c.name));
console.log('Hindi certificates count:', ggHp.certificates.length, ggHp.certificates.map(c => c.name));

console.log('\n--- INSPECTING KARUNGALI MALA WITH LORD MURUGAN CERTIFICATES ---');
const kmId = '4d567787-bd06-418e-be2a-7e5ab2ca0abf';
const kmEp = englishMap.get(kmId);
const kmHp = hindiMap.get(kmId);
console.log('English certificates count:', kmEp.certificates.length);
console.log('Hindi certificates count:', kmHp.certificates.length);

console.log('\n--- INSPECTING VIDYA RUDRAKSH GALLERY ---');
const vrId = '029a1b1a-85b4-4b5b-9d22-1ab9b986cf1e'; // Wait, let's find the correct ID for Vidya Rudraksh
const vrEp = english.find(p => p.name.includes('Vidya'));
const vrHp = hindi.find(p => p.name.includes('Vidya') || p.name.includes('विद्या'));
if (vrEp && vrHp) {
  console.log('Vidya Rudraksh ID:', vrEp.id);
  console.log('English gallery images:', vrEp.gallery_images.length, vrEp.gallery_images.map(g => g.url));
  console.log('Hindi gallery images:', vrHp.gallery_images.length, vrHp.gallery_images.map(g => g.url));
} else {
  console.log('Vidya Rudraksh not found');
}
