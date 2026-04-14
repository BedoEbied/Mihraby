import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM symmetric encryption for storing third-party OAuth tokens
 * (Zoom access/refresh tokens) at rest.
 *
 * Format (base64url-encoded, single string):
 *   <12-byte IV><16-byte auth tag><ciphertext>
 *
 * The key is loaded from APP_ENCRYPTION_KEY which MUST be a 32-byte value
 * encoded as base64. Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * NOTE: Rotating this key invalidates all previously-encrypted values. If you
 * ever need to rotate, run a migration that decrypts with the old key and
 * re-encrypts with the new one.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function loadKey(): Buffer {
  const encoded = process.env.APP_ENCRYPTION_KEY;
  if (!encoded) {
    throw new Error('APP_ENCRYPTION_KEY is not set. Required for encrypted token storage.');
  }
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `APP_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }
  return key;
}

/**
 * Encrypt a plaintext string. Returns a single base64url-encoded blob
 * containing IV + auth tag + ciphertext. Safe to store in a VARCHAR column.
 */
export function encrypt(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64url');
}

/**
 * Decrypt a value produced by `encrypt()`. Throws if the auth tag does not
 * verify (tampering or wrong key).
 */
export function decrypt(encoded: string): string {
  const key = loadKey();
  const buffer = Buffer.from(encoded, 'base64url');
  if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Encrypted value is too short to be valid.');
  }
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
