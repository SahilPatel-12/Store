const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Load env variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const s3Client = new S3Client({
  endpoint: env['VITE_CLOUDFLARE_ENDPOINT'],
  credentials: {
    accessKeyId: env['VITE_CLOUDFLARE_ACCESS_KEY_ID'],
    secretAccessKey: env['VITE_CLOUDFLARE_SECRET_ACCESS_KEY'],
  },
  region: 'auto',
});

async function run() {
  try {
    console.log('Fetching files from R2 and extracting names...');
    const command = new ListObjectsV2Command({
      Bucket: env['VITE_CLOUDFLARE_BUCKET_NAME'],
      Prefix: 'products/',
      MaxKeys: 1000
    });

    const response = await s3Client.send(command);
    if (!response.Contents) {
      console.log('No files found.');
      return;
    }

    const fileMap = {};
    response.Contents.forEach(obj => {
      const key = obj.Key;
      const parts = key.split('/');
      const filename = parts[parts.length - 1];
      // Extract original name after the uuid (if it matches uuid format like 8-4-4-4-12_name)
      const match = filename.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.*)$/);
      const originalName = match ? match[1] : filename;
      
      // Group by prefix folder
      const prefix = parts.slice(0, parts.length - 1).join('/');
      if (!fileMap[prefix]) {
        fileMap[prefix] = [];
      }
      fileMap[prefix].push({ key, originalName, size: obj.Size });
    });

    Object.keys(fileMap).forEach(prefix => {
      console.log(`Prefix: ${prefix}`);
      fileMap[prefix].forEach(file => {
        console.log(`  - Key: ${file.key} => Original Name: ${file.originalName}`);
      });
      console.log('--------------------');
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
