export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypts plaintext using AES-GCM (128-bit) with the provided 16-character secret key.
 * Combines standard 12-byte random IV with ciphertext and encodes as Base64.
 */
function loadForge(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).forge) {
      resolve((window as any).forge);
      return;
    }
    if (typeof document === 'undefined') {
      reject(new Error('Document is not available (SSR context)'));
      return;
    }
    const scriptId = 'forge-cdn-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (script) {
      script.addEventListener('load', () => resolve((window as any).forge));
      script.addEventListener('error', (err) => reject(err));
      return;
    }
    script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/forge/1.3.1/forge.min.js';
    script.onload = () => resolve((window as any).forge);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Encrypts plaintext using AES-GCM (128-bit) with the provided 16-character secret key.
 * Combines standard 12-byte random IV with ciphertext and encodes as Base64.
 */
export async function encryptText(plainText: string, secretKey: string): Promise<string> {
  const hasSubtle = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;
  if (!hasSubtle) {
    try {
      const forge = await loadForge();
      const keyBytes = secretKey.padEnd(16, ' ').slice(0, 16);
      const keyBuf = forge.util.createBuffer(keyBytes, 'binary');
      
      const ivBytes = forge.random.getBytesSync(12);
      const iv = new Uint8Array(12);
      for (let i = 0; i < 12; i++) {
        iv[i] = ivBytes.charCodeAt(i);
      }

      const cipher = forge.cipher.createCipher('AES-GCM', keyBuf);
      cipher.start({ iv: ivBytes });
      cipher.update(forge.util.createBuffer(plainText, 'utf8'));
      cipher.finish();
      
      const ciphertextBytes = cipher.output.getBytes();
      const tagBytes = cipher.mode.tag.getBytes();
      
      const combinedLength = iv.length + ciphertextBytes.length + tagBytes.length;
      const combined = new Uint8Array(combinedLength);
      combined.set(iv, 0);
      for (let i = 0; i < ciphertextBytes.length; i++) {
        combined[iv.length + i] = ciphertextBytes.charCodeAt(i);
      }
      for (let i = 0; i < tagBytes.length; i++) {
        combined[iv.length + ciphertextBytes.length + i] = tagBytes.charCodeAt(i);
      }
      
      let binary = '';
      for (let i = 0; i < combined.byteLength; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary);
    } catch (e) {
      console.error('Encryption fallback failed:', e);
      throw new Error('Encryption failed');
    }
  }

  try {
    const encoder = new TextEncoder();
    // Guarantee exactly 16 bytes for a 128-bit AES key
    const keyData = encoder.encode(secretKey.padEnd(16, ' ').slice(0, 16));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoder.encode(plainText)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Modern browser-safe base64 conversion
    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error('Encryption failed:', e);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts a Base64 encoded ciphertext string using AES-GCM with the 16-character secret key.
 */
export async function decryptText(cipherTextBase64: string, secretKey: string): Promise<string> {
  const hasSubtle = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;
  if (!hasSubtle) {
    try {
      const forge = await loadForge();
      const keyBytes = secretKey.padEnd(16, ' ').slice(0, 16);
      const keyBuf = forge.util.createBuffer(keyBytes, 'binary');
      
      const binaryString = atob(cipherTextBase64);
      const len = binaryString.length;
      const combined = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }
      
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      const tag = encryptedData.slice(encryptedData.length - 16);
      const ciphertext = encryptedData.slice(0, encryptedData.length - 16);
      
      let ivBin = '';
      for (let i = 0; i < iv.length; i++) ivBin += String.fromCharCode(iv[i]);
      let tagBin = '';
      for (let i = 0; i < tag.length; i++) tagBin += String.fromCharCode(tag[i]);
      let ctBin = '';
      for (let i = 0; i < ciphertext.length; i++) ctBin += String.fromCharCode(ciphertext[i]);

      const ivBuf = forge.util.createBuffer(ivBin, 'binary');
      const tagBuf = forge.util.createBuffer(tagBin, 'binary');
      const ctBuf = forge.util.createBuffer(ctBin, 'binary');

      const decipher = forge.cipher.createDecipher('AES-GCM', keyBuf);
      decipher.start({
        iv: ivBuf,
        tag: tagBuf
      });
      decipher.update(ctBuf);
      const success = decipher.finish();
      if (!success) {
        throw new Error('Authentication tag validation failed.');
      }
      return decipher.output.toString();
    } catch (e) {
      console.error('Decryption fallback failed:', e);
      throw new Error('Decryption failed. Check key compatibility.');
    }
  }

  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const keyData = encoder.encode(secretKey.padEnd(16, ' ').slice(0, 16));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const binaryString = atob(cipherTextBase64);
    const len = binaryString.length;
    const combined = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedData
    );

    return decoder.decode(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    throw new Error('Decryption failed. Check key compatibility.');
  }
}
