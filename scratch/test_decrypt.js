import { webcrypto } from 'crypto';

const cipherTextBase64 = "ElYnIJ4YOGKxTnHIFdNah/NN5u87QH8kX8gONQfgfk/aGg==";
const secretKey = "sg6XisTlL2QcXSuE";

async function decryptText(cipherTextBase64, secretKey) {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const keyData = encoder.encode(secretKey.padEnd(16, ' ').slice(0, 16));
    const cryptoKey = await webcrypto.subtle.importKey(
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

    const decrypted = await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedData
    );

    return decoder.decode(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    throw e;
  }
}

decryptText(cipherTextBase64, secretKey)
  .then(res => console.log('Successfully decrypted:', res))
  .catch(err => console.log('Error decrypting:', err.message));
