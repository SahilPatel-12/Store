import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const endpoint = import.meta.env.VITE_CLOUDFLARE_ENDPOINT || '';
const accessKeyId = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID || '';
const secretAccessKey = import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY || '';
const bucketName = import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME || 'mantrapujaapp';
const publicBaseUrl = import.meta.env.VITE_CLOUDFLARE_PUBLIC_BASE_URL || '';

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.warn('Cloudflare R2 configurations are missing from environment variables. Ensure .env.local is present.');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

/**
 * Uploads a file directly to Cloudflare R2 bucket and returns its public CDN URL.
 * @param file The File object to upload
 * @param pathPrefix Directory prefix (e.g. 'products/thumbnails')
 */
export async function uploadToR2(file: File, pathPrefix: string = 'products'): Promise<string> {
  const uniqueId = crypto.randomUUID();
  const nameParts = file.name.split('.');
  const extension = nameParts.length > 1 ? nameParts.pop() : '';
  const sanitizedName = nameParts.join('.').replace(/[^a-zA-Z0-9]/g, '_');
  
  const key = `${pathPrefix}/${uniqueId}_${sanitizedName}${extension ? '.' + extension : ''}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: file.type,
    });

    await s3Client.send(command);

    const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
    return `${cleanBaseUrl}/${key}`;
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw new Error('Could not upload asset to Cloudflare R2 storage: ' + (error as Error).message);
  }
}
