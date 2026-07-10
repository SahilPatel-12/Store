const fs = require('fs');
const path = require('path');

const migrationDir = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\src\\migrations';

// Clean up old incorrect files
for (let b = 1; b <= 6; b++) {
  const oldFile = path.join(migrationDir, `7${b}_add_hindi_shop_products_batch_0${b}.sql`);
  if (fs.existsSync(oldFile)) {
    fs.unlinkSync(oldFile);
    console.log(`Deleted: ${oldFile}`);
  }
}
