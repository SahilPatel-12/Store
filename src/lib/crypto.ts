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
export async function encryptText(plainText: string, secretKey: string): Promise<string> {
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
