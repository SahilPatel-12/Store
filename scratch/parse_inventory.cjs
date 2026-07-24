const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, 'db_inventory_row_counts.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

console.log('=== Active tables with > 0 rows ===');
const active = inventory.successTables.filter(t => t.count > 0).sort((a, b) => b.count - a.count);
active.forEach(a => {
  console.log(`${a.table}: ${a.count}`);
});

console.log('\n=== Empty tables with 0 rows ===');
const empty = inventory.successTables.filter(t => t.count === 0).sort((a, b) => a.table.localeCompare(b.table));
empty.forEach(e => {
  console.log(`${e.table}`);
});
