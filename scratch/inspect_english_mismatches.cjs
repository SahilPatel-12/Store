const fs = require('fs');

const english = JSON.parse(fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json', 'utf-8')).products;

const p1 = english.find(p => p.id === 'ef68116b-09ae-4034-812a-8c6ecb898a12');
const p2 = english.find(p => p.id === 'e8c015d8-dd72-461f-830c-7f113dede450');
const p3 = english.find(p => p.id === 'a6bd58fa-b20b-4a11-b63f-fe7b71dc156b');
const p4 = english.find(p => p.id === '4d567787-bd06-418e-be2a-7e5ab2ca0abf');
const p5 = english.find(p => p.id === '9b2524ca-7eb8-43c0-9465-e38d00326eb6');

console.log('--- 7 HORSES ---');
console.log(JSON.stringify(p1, null, 2));

console.log('\n--- DHAN YOG BRACELET ---');
console.log(JSON.stringify(p2, null, 2));

console.log('\n--- GAURI GANESH CERTIFICATES ---');
console.log(JSON.stringify(p3.certificates, null, 2));

console.log('\n--- KARUNGALI CERTIFICATES ---');
console.log(JSON.stringify(p4.certificates, null, 2));

console.log('\n--- VIDYA RUDRAKSH GALLERY ---');
console.log(JSON.stringify(p5.gallery_images, null, 2));
