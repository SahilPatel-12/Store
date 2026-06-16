import http from 'https';
import vm from 'vm';
import { webcrypto } from 'crypto';

const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/forge/1.3.1/forge.min.js';
const plainText = "Hello World GCM Fallback 2026";
const secretKey = "sg6XisTlL2QcXSuE";

function downloadCDN(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

async function run() {
  console.log('Downloading forge from CDN...');
  const forgeCode = await downloadCDN(cdnUrl);
  
  const context = { window: {}, console };
  const script = new vm.Script(forgeCode);
  script.runInNewContext(context);
  const forge = context.window.forge;

  console.log('--- ENCRYPTING WITH FORGE FALLBACK ---');
  let cipherTextBase64 = '';
  try {
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
    
    cipherTextBase64 = Buffer.from(combined).toString('base64');
    console.log('Generated Ciphertext Base64:', cipherTextBase64);
  } catch (err) {
    console.error('Encryption failed via forge:', err);
    return;
  }

  console.log('\n--- DECRYPTING WITH WEB CRYPTO API ---');
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

    console.log('Web Crypto Decryption Result:', decoder.decode(decrypted));
  } catch (err) {
    console.error('Web Crypto Decryption failed:', err);
  }

  console.log('\n--- DECRYPTING WITH FORGE FALLBACK ---');
  try {
    const keyBytes = secretKey.padEnd(16, ' ').slice(0, 16);
    const keyBuf = forge.util.createBuffer(keyBytes, 'binary');
    
    const binaryString = Buffer.from(cipherTextBase64, 'base64').toString('binary');
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
    console.log('Forge Decryption Result:', decipher.output.toString());
  } catch (err) {
    console.error('Forge Decryption failed:', err);
  }
}

run();
