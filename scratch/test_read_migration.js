import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../src/migrations/test_migration.sql');
const content = fs.readFileSync(filePath, 'utf-8');
console.log('Read content:', content);
