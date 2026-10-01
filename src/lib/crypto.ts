import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getEnv } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;
const BCRYPT_ROUNDS = 12;

/**
 * Encrypt sensitive text (such as IBAN or card numbers) using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex encoded)
 */
export function encryptSensitiveData(plainText: string): string {
  const env = getEnv();
  // Derive a 32-byte key from ENCRYPTION_KEY using sha256
  const key = crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt sensitive text previously encrypted with AES-256-GCM.
 */
export function decryptSensitiveData(encryptedPayload: string): string {
  const env = getEnv();
  const key = crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest();

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }

  const [ivHex, tagHex, contentHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encryptedText = Buffer.from(contentHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Hash password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password against bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure 6-digit delivery code.
 */
export function generateDeliveryCode(): string {
  // Generate random integer in [100000, 999999]
  const val = crypto.randomInt(100000, 1000000);
  return val.toString();
}

/**
 * Generate a cryptographically secure random salt (hex).
 */
export function generateSalt(length = 16): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash a delivery code using salt + server pepper via HMAC-SHA256.
 */
export function hashDeliveryCode(code: string, salt: string): string {
  const env = getEnv();
  const hmac = crypto.createHmac("sha256", env.DELIVERY_CODE_PEPPER);
  hmac.update(`${salt}:${code.trim()}`);
  return hmac.digest("hex");
}

/**
 * Constant-time verification of a candidate delivery code.
 */
export function verifyDeliveryCode(candidateCode: string, salt: string, storedHash: string): boolean {
  const computedHash = hashDeliveryCode(candidateCode, salt);
  const bufA = Buffer.from(computedHash, "hex");
  const bufB = Buffer.from(storedHash, "hex");

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
