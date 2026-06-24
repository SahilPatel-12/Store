import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
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
const publicBaseUrl = env['VITE_CLOUDFLARE_PUBLIC_BASE_URL'];

const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

const names = [
  'Acharya Raghav Sharma', 'Acharya Devendra Shastri', 'Acharya Subramanya Iyer',
  'Acharya Bhavesh Shukla', 'Acharya Gaurang Bhatt', 'Acharya Kuberanand Mishra',
  'Acharya Lakshmikant Dwivedi', 'Acharya Narayan Shukla', 'Acharya Venkatesh Trivedi',
  'Acharya Adwait Raman', 'Acharya Arvind Pathak', 'Acharya Rudransh Pathak',
  'Acharya Veerendra Joshi', 'Acharya Suryakant Vyas', 'Acharya Shubhendra Sharma',
  'Acharya Vishwajeet Dwivedi', 'Acharya Somnath Shastri', 'Acharya Vidyadhar Dwivedi',
  'Pandit Ramakant Joshi', 'Acharya Rajesh Shastri'
];

function downloadAvatar(name) {
  return new Promise((resolve, reject) => {
    const url = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name)}`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function upload(buffer, filename) {
  const key = `products/pundits/${filename}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'image/png'
  }));
  const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
  return `${cleanBaseUrl}/${key}`;
}

async function run() {
  console.log('Downloading and uploading avatars...');
  const results = {};
  for (const name of names) {
    try {
      const buffer = await downloadAvatar(name);
      const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${nameSlug}_${crypto.randomUUID().substring(0, 8)}.png`;
      const url = await upload(buffer, filename);
      console.log(`Uploaded ${name} -> ${url}`);
      results[name] = url;
    } catch (e) {
      console.error(`Failed for ${name}:`, e.message);
      results[name] = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name)}`;
    }
  }
  fs.writeFileSync(path.join(__dirname, 'uploaded_pundits.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('Done!');
}

run();
