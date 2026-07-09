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
 * Encrypts a string server-side using AES-256-GCM with a custom raw key string
 * @param {string} text Plaintext input to encrypt
 * @param {string} rawKey Raw environment key string
 * @returns {{ ciphertext: string, iv: string, authTag: string }}
 */
export function encryptTextWithCustomKey(text, rawKey) {
  const derivedKey = crypto.createHash('sha256').update(rawKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
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
 * Decrypts a ciphertext server-side using AES-256-GCM with a custom raw key string
 * @param {string} ciphertext Hex encoded ciphertext
 * @param {string} ivHex Hex encoded IV
 * @param {string} authTagHex Hex encoded Auth Tag
 * @param {string} rawKey Raw environment key string
 * @returns {string} Plaintext decrypted output
 */
export function decryptTextWithCustomKey(ciphertext, ivHex, authTagHex, rawKey) {
  const derivedKey = crypto.createHash('sha256').update(rawKey).digest();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    derivedKey,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

