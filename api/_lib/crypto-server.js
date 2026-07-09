import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Derive a secure 256-bit key from the server encryption environment variable
const RAW_KEY = process.env.PAYMENT_CONFIG_ENCRYPTION_KEY || process.env.ENCRYPTION_STRING_KEY || 'dev_fallback_payment_encryption_key_must_be_rotated_prod';
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

/**
 * Encrypts a string server-side using AES-256-GCM
 * @param {string} text Plaintext input to encrypt
 * @returns {{ ciphertext: string, iv: string, authTag: string }}
 */
export function encryptTextServer(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
}

/**
 * Decrypts a ciphertext server-side using AES-256-GCM
 * @param {string} ciphertext Hex encoded ciphertext
 * @param {string} ivHex Hex encoded IV
 * @param {string} authTagHex Hex encoded Auth Tag
 * @returns {string} Plaintext decrypted output
 */
export function decryptTextServer(ciphertext, ivHex, authTagHex) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Encrypts a string server-side using AES-256-GCM with a dynamic key (e.g. ESG_91)
 */
export function encryptTextWithCustomKey(text, keyString) {
  const iv = crypto.randomBytes(12);
  const keyHash = crypto.createHash('sha256').update(keyString).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, keyHash, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
}

/**
 * Decrypts a ciphertext server-side using AES-256-GCM with a dynamic key (e.g. ESG_91)
 */
export function decryptTextWithCustomKey(ciphertext, ivHex, authTagHex, keyString) {
  const keyHash = crypto.createHash('sha256').update(keyString).digest();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    keyHash,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
