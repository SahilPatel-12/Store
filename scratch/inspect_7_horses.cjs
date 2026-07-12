const fs = require('fs');
const english = JSON.parse(fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json', 'utf-8')).products;
const p1 = english.find(p => p.id === 'ef68116b-09ae-4034-812a-8c6ecb898a12');
console.log(JSON.stringify(p1, null, 2));
