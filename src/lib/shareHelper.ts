import QRCode from 'qrcode';
import logo from '../assets/My_logo/Frame 16.png';
import { uploadToR2 } from './cloudflare/r2';

/**
 * Converts any local or remote image URL to a Base64 Data URL
 * to prevent CORS/security issues during Canvas rendering.
 */
const getAssetAsDataUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image blob as Data URL.'));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error converting asset to data URL:', err);
    return url;
  }
};

/**
 * Dynamically constructs a premium, high-resolution referral sharing card 
 * containing the Mantra Puja logo, the devotee's referral QR barcode,
 * and decorative spiritual program borders.
 */
export const createReferralShareCard = async (
  referralLink: string
): Promise<Blob> => {
  const qrDataUrl = await QRCode.toDataURL(referralLink, {
    margin: 1,
    width: 600,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const logoDataUrl = await getAssetAsDataUrl(logo);

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not available.'));
      return;
    }

    // 1. Draw elegant spiritual background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#fffbf7'); // soft cream
    gradient.addColorStop(0.5, '#fff5ea'); // light warm orange
    gradient.addColorStop(1, '#ffedd5'); // deep peach accent
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw outer orange border
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // 3. Draw inner gold border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

    // Load images
    const logoImg = new Image();
    const qrImg = new Image();

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        try {
          // Draw brand logo centered at the top
          const logoAspect = logoImg.width / logoImg.height;
          const logoWidth = 280;
          const logoHeight = logoWidth / logoAspect;
          const logoX = (canvas.width - logoWidth) / 2;
          const logoY = 80;
          ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

          // Draw separator line
          ctx.beginPath();
          ctx.moveTo(120, logoY + logoHeight + 35);
          ctx.lineTo(canvas.width - 120, logoY + logoHeight + 35);
          ctx.strokeStyle = 'rgba(234, 88, 12, 0.2)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Title
          ctx.fillStyle = '#2d140e';
          ctx.font = 'bold 36px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('Mantra Puja Blessings', canvas.width / 2, logoY + logoHeight + 85);

          // Subtitle
          ctx.fillStyle = '#ea580c';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.fillText('PARTNER REFERRAL PROGRAM', canvas.width / 2, logoY + logoHeight + 125);

          // QR Code Card background with shadow
          const qrSize = 380;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = logoY + logoHeight + 175;

          ctx.shadowColor = 'rgba(45, 20, 14, 0.08)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 8;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          const rx = qrX - 20;
          const ry = qrY - 20;
          const rw = qrSize + 40;
          const rh = qrSize + 40;
          const radius = 20;
          ctx.moveTo(rx + radius, ry);
          ctx.lineTo(rx + rw - radius, ry);
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
          ctx.lineTo(rx + rw, ry + rh - radius);
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
          ctx.lineTo(rx + radius, ry + rh - radius);
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
          ctx.lineTo(rx, ry + radius);
          ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
          ctx.closePath();
          ctx.fill();

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Draw QR barcode image
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // Dynamic Text/Instruction at the bottom
          ctx.fillStyle = '#4c1d11';
          ctx.font = 'italic 22px Georgia, serif';
          ctx.fillText('Scan barcode to connect & explore divine offerings', canvas.width / 2, qrY + qrSize + 85);

          // Referral Link Text
          ctx.fillStyle = '#ea580c';
          ctx.font = '600 20px system-ui, sans-serif';
          ctx.fillText(referralLink, canvas.width / 2, qrY + qrSize + 125);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate Canvas image blob.'));
              }
            },
            'image/png'
          );
        } catch (drawErr) {
          reject(drawErr);
        }
      }
    };

    logoImg.onload = checkLoaded;
    qrImg.onload = checkLoaded;

    logoImg.onerror = () => reject(new Error('Failed to load branding logo asset.'));
    qrImg.onerror = () => reject(new Error('Failed to load referral QR barcode.'));

    logoImg.src = logoDataUrl;
    qrImg.src = qrDataUrl;
  });
};

/**
 * Compiles the referral share card and uploads it to Cloudflare R2.
 * Returns the public URL of the uploaded image asset.
 */
export const uploadReferralShareCard = async (
  referralLink: string,
  affiliateCode: string
): Promise<string> => {
  const cardBlob = await createReferralShareCard(referralLink);
  const file = new File([cardBlob], `MantraPuja-Referral-${affiliateCode}.png`, { type: 'image/png' });
  const publicUrl = await uploadToR2(file, 'referrals', true);
  return publicUrl;
};

/**
 * Creates a premium canvas sharing image for a product order,
 * combining the user's uploaded banner image (vidya_rudraksh_share.jpg) and our brand logo.
 */
export const createProductShareCard = async (): Promise<Blob> => {
  const logoDataUrl = await getAssetAsDataUrl(logo);
  const bannerUrl = '/vidya_rudraksh_share.jpg';
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 500; // Banner aspect ratio is 2:1 (1000x500)
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not available.'));
      return;
    }

    const logoImg = new Image();
    const bannerImg = new Image();

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        try {
          // 1. Draw the user uploaded banner as the main background
          ctx.drawImage(bannerImg, 0, 0, canvas.width, canvas.height);

          // 2. Overlay our brand logo at the top-left corner with a soft background plate
          const logoWidth = 160;
          const logoHeight = 35;
          const padding = 10;
          const rx = 15;
          const ry = 15;
          
          // Draw a semi-transparent white backing plate for the logo so it stands out
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 10;
          
          // Draw rounded rectangle plate (compatible with older browsers by drawing manually)
          ctx.beginPath();
          const px = rx;
          const py = ry;
          const pw = logoWidth + padding * 2;
          const ph = logoHeight + padding * 2;
          const rad = 10;
          ctx.moveTo(px + rad, py);
          ctx.lineTo(px + pw - rad, py);
          ctx.quadraticCurveTo(px + pw, py, px + pw, py + rad);
          ctx.lineTo(px + pw, py + ph - rad);
          ctx.quadraticCurveTo(px + pw, py + ph, px + pw - rad, py + ph);
          ctx.lineTo(px + rad, py + ph);
          ctx.quadraticCurveTo(px, py + ph, px, py + ph - rad);
          ctx.lineTo(px, py + rad);
          ctx.quadraticCurveTo(px, py, px + rad, py);
          ctx.closePath();
          ctx.fill();
          
          // Reset shadow for logo drawing
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          
          // Draw the brand logo inside the plate
          ctx.drawImage(logoImg, rx + padding, ry + padding, logoWidth, logoHeight);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate Product Share Canvas.'));
              }
            },
            'image/jpeg',
            0.9
          );
        } catch (drawErr) {
          reject(drawErr);
        }
      }
    };

    logoImg.onload = checkLoaded;
    bannerImg.onload = checkLoaded;

    logoImg.onerror = () => reject(new Error('Failed to load brand logo.'));
    bannerImg.onerror = () => reject(new Error('Failed to load banner image.'));

    logoImg.src = logoDataUrl;
    bannerImg.src = bannerUrl;
  });
};

