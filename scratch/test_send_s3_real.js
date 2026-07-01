import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const endpoint = env['VITE_CLOUDFLARE_ENDPOINT'];
const accessKeyId = env['VITE_CLOUDFLARE_ACCESS_KEY_ID'];
const secretAccessKey = env['VITE_CLOUDFLARE_SECRET_ACCESS_KEY'];
const bucketName = env['VITE_CLOUDFLARE_BUCKET_NAME'] || 'mantrapujaapp';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

try {
  await s3Client.send(new PutObjectCommand({ Bucket: bucketName, Key: 'test_real_key.txt', Body: 'hello' }));
  console.log('Real S3 send completed successfully');
} catch (e) {
  console.log('Error from real send:', e.message);
}
