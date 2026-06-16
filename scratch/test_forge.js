import http from 'https';
import fs from 'fs';
import vm from 'vm';

const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/forge/1.3.1/forge.min.js';
const cipherTextBase64 = "ElYnIJ4YOGKxTnHIFdNah/NN5u87QH8kX8gONQfgfk/aGg==";
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
  
  // Create a context and run forge in it
  const context = { window: {}, console };
  const script = new vm.Script(forgeCode);
  script.runInNewContext(context);
  
  const forge = context.window.forge;
  console.log('Forge downloaded and loaded successfully. Forge version:', forge.version);

  try {
    const keyBytes = secretKey.padEnd(16, ' ').slice(0, 16);
    
    const binaryString = Buffer.from(cipherTextBase64, 'base64').toString('binary');
    const len = binaryString.length;
    const combined = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // Last 16 bytes is the authentication tag
    const tag = encryptedData.slice(encryptedData.length - 16);
    const ciphertext = encryptedData.slice(0, encryptedData.length - 16);
    
    // Node-forge expects binary strings for key, iv, tag, and ciphertext
    const keyBuf = forge.util.createBuffer(keyBytes, 'binary');
    const ivBuf = forge.util.createBuffer(Buffer.from(iv).toString('binary'), 'binary');
    const tagBuf = forge.util.createBuffer(Buffer.from(tag).toString('binary'), 'binary');
    const ctBuf = forge.util.createBuffer(Buffer.from(ciphertext).toString('binary'), 'binary');

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
    console.log('Successfully decrypted via forge:', decipher.output.toString());
  } catch (err) {
    console.error('Decryption failed via forge:', err);
  }
}

run();
