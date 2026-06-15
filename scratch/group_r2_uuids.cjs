const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'r2_files_list.json'), 'utf-8'));
const groups = {};

data.forEach(item => {
  const key = item.key;
  const parts = key.split('/');
  const filename = parts[parts.length - 1];
  
  // Extract UUID prefix and the descriptive suffix
  const match = filename.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_(.*)$/);
  if (match) {
    const uuid = match[1];
    const suffix = match[2];
    if (!groups[uuid]) {
      groups[uuid] = {
        prefix: parts.slice(0, parts.length - 1).join('/'),
        files: []
      };
    }
    groups[uuid].files.push(suffix);
  }
});

console.log('Unique UUID prefixes and their files:');
Object.keys(groups).forEach(uuid => {
  console.log(`- UUID: ${uuid} (Folder: ${groups[uuid].prefix})`);
  console.log(`  Files: ${groups[uuid].files.sort().join(', ')}`);
});
