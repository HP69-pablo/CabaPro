import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptSensitiveData,
  decryptSensitiveData,
  hashPassword,
  verifyPassword,
  generateDeliveryCode,
  generateSalt,
  hashDeliveryCode,
  verifyDeliveryCode,
} from "../../lib/crypto";

describe("Crypto Utilities", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/cabapro";
    process.env.AUTH_SECRET = "12345678901234567890123456789012";
    process.env.ENCRYPTION_KEY = "super-secret-encryption-key-32-chars-long";
    process.env.DELIVERY_CODE_PEPPER = "pepper-secret-minimum-16-chars";
  });

  describe("AES-256-GCM Encryption / Decryption", () => {
    it("encrypts and decrypts sensitive IBAN/card numbers accurately", () => {
      const plainText = "DZ0000000000001234567890";
      const encrypted = encryptSensitiveData(plainText);

      expect(encrypted).not.toBe(plainText);
      expect(encrypted.split(":").length).toBe(3);

      const decrypted = decryptSensitiveData(encrypted);
      expect(decrypted).toBe(plainText);
    });

    it("throws an error when decrypting tampered data", () => {
      const encrypted = encryptSensitiveData("secret-data");
      const [iv, tag, ciphertext] = encrypted.split(":");
      // Tamper with the ciphertext
      const tampered = `${iv}:${tag}:${ciphertext.slice(0, -2)}ff`;

      expect(() => decryptSensitiveData(tampered)).toThrow();
    });
  });

  describe("Password Hashing", () => {
    it("hashes and verifies passwords correctly", async () => {
      const password = "SecurePassword2026!";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword("WrongPassword", hash)).toBe(false);
    });
  });

  describe("Delivery Code Generation & Salted Hashing", () => {
    it("generates a valid 6-digit numeric string", () => {
      const code = generateDeliveryCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code, 10)).toBeLessThanOrEqual(999999);
    });

    it("hashes delivery code with salt & pepper and validates correctly", () => {
      const code = "839201";
      const salt = generateSalt();
      const hash = hashDeliveryCode(code, salt);

      expect(hash).toHaveLength(64); // SHA-256 hex length
      expect(verifyDeliveryCode(code, salt, hash)).toBe(true);
      expect(verifyDeliveryCode("839202", salt, hash)).toBe(false);
    });
  });
});
