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
    console.log('Listing all files with prefix "products/"...');
    const command = new ListObjectsV2Command({
      Bucket: env['VITE_CLOUDFLARE_BUCKET_NAME'],
      Prefix: 'products/',
      MaxKeys: 1000
    });

    const response = await s3Client.send(command);
    if (response.Contents) {
      response.Contents.forEach(obj => {
        console.log(`${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log('No files found.');
    }
  } catch (err) {
    console.error('Error listing R2 products:', err);
  }
}

run();
