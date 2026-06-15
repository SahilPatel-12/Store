const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'r2_files_list.json');
if (!fs.existsSync(jsonPath)) {
  console.error('JSON file does not exist');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const suffixGroups = {};

data.forEach(item => {
  const key = item.key;
  const parts = key.split('/');
  const filename = parts[parts.length - 1];
  
  // Suffix pattern: extract original name (e.g. from uuid_name.ext extract name.ext or just the main part)
  const match = filename.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.*)$/);
  const name = match ? match[1] : filename;
  
  // Suffix category: split by dot and get the descriptive part before extension
  const dotIndex = name.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
  
  if (!suffixGroups[baseName]) {
    suffixGroups[baseName] = [];
  }
  suffixGroups[baseName].push(key);
});

console.log('Unique suffix base names and their count:');
Object.keys(suffixGroups).sort().forEach(baseName => {
  console.log(`- ${baseName}: ${suffixGroups[baseName].length} files`);
  console.log(`  Example key: ${suffixGroups[baseName][0]}`);
});
