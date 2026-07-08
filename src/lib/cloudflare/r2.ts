/**
 * Cloudflare R2 Client Upload Helper (Refactored to secure server-side pre-signed URLs)
 */

function getSessionToken(): string | null {
  try {
    return localStorage.getItem('session_token');
  } catch (e) {
    return null;
  }
}

function getAdminToken(): string | null {
  try {
    const stored = localStorage.getItem('ridae_admin_auth_session');
    if (stored) {
      const session = JSON.parse(stored);
      return session?.token || null;
    }
  } catch (e) {}
  return null;
}

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
 * Uploads a file using secure, short-lived pre-signed URLs from the server.
 * @param file The File object to upload
 * @param pathPrefix Directory prefix (e.g. 'products/thumbnails')
 * @param skipCompression Skip client-side image compression
 */
export async function uploadToR2(file: File, pathPrefix: string = 'products', skipCompression = false): Promise<string> {
  // Compress image client-side before uploading unless skipped
  const processedFile = skipCompression ? file : await compressImage(file);

  const prefixToPurpose: Record<string, string> = {
    'referrals': 'referrals',
    'products/thumbnails': 'products/thumbnails',
    'products/gallery': 'products/gallery',
    'products/videos': 'products/videos',
    'products/pundits': 'products/pundits',
    'priests': 'priests',
    'banners': 'banners',
    'homepage/banners': 'banners',
    'homepage/showcase': 'banners',
    'shop/main-banners': 'banners',
    'astrologers/photos': 'astrologers/photos',
    'pundits/photos': 'pundits/photos',
    'pundits/documents': 'pundits/documents',
    'orders/proofs': 'orders/proofs',
    'reviews/images': 'reviews/images',
    'reviews/videos': 'reviews/videos'
  };

  let purpose = prefixToPurpose[pathPrefix] || pathPrefix;
  if (pathPrefix.startsWith('shop/category-banners')) {
    purpose = 'banners';
  }
  if (pathPrefix.startsWith('section-icons-')) {
    purpose = 'section-icons';
  }

  const sessionToken = getSessionToken();
  const adminToken = getAdminToken();

  try {
    // 1. Get pre-signed URL from server
    const sigResponse = await fetch('/api/r2-presigned', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        purpose,
        filename: processedFile.name,
        contentType: processedFile.type,
        fileSize: processedFile.size,
        sessionToken,
        adminToken
      })
    });

    if (!sigResponse.ok) {
      const errData = await sigResponse.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${sigResponse.status}`);
    }

    const { presignedUrl, publicUrl } = await sigResponse.json();

    // 2. Perform direct PUT upload to R2
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': processedFile.type
      },
      body: processedFile
    });

    if (!uploadResponse.ok) {
      throw new Error(`Direct upload failed with status ${uploadResponse.status}`);
    }

    return publicUrl;
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw new Error('Could not upload asset to Cloudflare R2: ' + (error as Error).message);
  }
}

/**
 * Deletes a file from Cloudflare R2 based on its public URL.
 * @param url The public URL of the asset to delete
 */
export async function deleteFromR2(url: string): Promise<void> {
  if (!url) return;
  if (url.startsWith('blob:') || !url.startsWith('http')) {
    return;
  }

  const adminToken = getAdminToken();
  if (!adminToken) {
    console.warn('[R2 Client] Asset deletion requires admin privileges.');
    return;
  }

  try {
    const response = await fetch('/api/r2-presigned', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        adminToken
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    console.log(`[R2 Client] Deleted asset successfully: ${url}`);
  } catch (error) {
    console.error('R2 deletion failed:', error);
  }
}
