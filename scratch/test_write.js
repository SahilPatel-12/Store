import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../src/migrations/test_migration.sql');
fs.writeFileSync(filePath, 'SELECT 1;', 'utf-8');
console.log('File written successfully');
