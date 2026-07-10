const fs = require('fs');

const english = JSON.parse(fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json', 'utf-8')).products;
const p1 = english.find(p => p.id === 'ef68116b-09ae-4034-812a-8c6ecb898a12');
const p2 = english.find(p => p.id === 'e8c015d8-dd72-461f-830c-7f113dede450');

console.log('7 Horses in English keys:', Object.keys(p1).filter(k => !['name','id','description'].includes(k)));
console.log('Dhan Yog in English keys:', Object.keys(p2).filter(k => !['name','id','description'].includes(k)));
