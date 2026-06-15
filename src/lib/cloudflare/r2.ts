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
 * Helper to compress image client-side using Canvas.
 * Resizes the image to a max dimension of 1920px (preserving aspect ratio)
 * and applies an 80% quality compression. PNGs are converted to transparent-supporting WEBP.
 */
async function compressImage(file: File, maxDimension = 1920, quality = 0.8): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }
  
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale proportionally if width or height exceeds maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let outputType = file.type;
        let outputExtension = file.name.split('.').pop() || '';

        // Convert PNG to WEBP to preserve transparency while keeping file size small
        if (file.type === 'image/png') {
          outputType = 'image/webp';
          outputExtension = 'webp';
        } else if (file.type !== 'image/webp') {
          outputType = 'image/jpeg';
          outputExtension = 'jpg';
        }

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
              const compressedFile = new File([blob], `${nameWithoutExt}.${outputExtension}`, {
                type: outputType,
                lastModified: Date.now(),
              });
              console.log(`[Compression] Reduced size of ${file.name} from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB (${outputType})`);
              resolve(compressedFile);
            } else {
              // If compression did not result in smaller size, keep original file
              resolve(file);
            }
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file directly to Cloudflare R2 bucket and returns its public CDN URL.
 * Automatically compresses image files before upload.
 * @param file The File object to upload
 * @param pathPrefix Directory prefix (e.g. 'products/thumbnails')
 */
export async function uploadToR2(file: File, pathPrefix: string = 'products'): Promise<string> {
  // Compress image client-side before uploading
  const processedFile = await compressImage(file);

  const uniqueId = crypto.randomUUID();
  const nameParts = processedFile.name.split('.');
  const extension = nameParts.length > 1 ? nameParts.pop() : '';
  const sanitizedName = nameParts.join('.').replace(/[^a-zA-Z0-9]/g, '_');
  
  const key = `${pathPrefix}/${uniqueId}_${sanitizedName}${extension ? '.' + extension : ''}`;

  try {
    const arrayBuffer = await processedFile.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: processedFile.type,
    });

    await s3Client.send(command);

    const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
    return `${cleanBaseUrl}/${key}`;
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw new Error('Could not upload asset to Cloudflare R2 storage: ' + (error as Error).message);
  }
}

