import crypto from 'crypto';
console.log('UUID:', crypto.randomUUID());
console.log('Bytes:', crypto.randomBytes(3).toString('hex'));
