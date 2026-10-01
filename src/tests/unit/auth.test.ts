import { describe, it, expect, beforeEach } from "vitest";
import { registerSchema, loginSchema, phoneOtpVerifySchema } from "../../modules/auth/schemas";
import { DemoPhoneOtpProvider } from "../../modules/auth/phone-otp";
import { AuthService } from "../../modules/auth/service";
import { ForbiddenError } from "../../lib/errors";
import { UserRole } from "@prisma/client";

describe("Phase 1 - Authentication & RBAC Unit Tests", () => {
  describe("Zod Validation Schemas", () => {
    it("validates valid registration payload", () => {
      const valid = {
        email: "yacine.bringer@example.com",
        password: "ValidPassword123!",
        firstName: "Yacine",
        lastName: "Benali",
        preferredLanguage: "fr",
        preferredCurrencyCode: "EUR",
      };

      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects weak passwords missing uppercase or number", () => {
      const invalid = {
        email: "test@example.com",
        password: "lowercaseonly",
        firstName: "Amine",
        lastName: "Boumediene",
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email formats", () => {
      const invalid = {
        email: "not-an-email",
        password: "ValidPassword123!",
        firstName: "Amine",
        lastName: "Boumediene",
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("validates 6-digit OTP verification code", () => {
      expect(phoneOtpVerifySchema.safeParse({ phone: "+213555123456", code: "123456" }).success).toBe(true);
      expect(phoneOtpVerifySchema.safeParse({ phone: "+213555123456", code: "123" }).success).toBe(false);
    });
  });

  describe("Phone OTP Provider Abstraction", () => {
    let otpProvider: DemoPhoneOtpProvider;

    beforeEach(() => {
      otpProvider = new DemoPhoneOtpProvider();
    });

    it("sends OTP and verifies successfully with matching code", async () => {
      const phone = "+213555987654";
      const sendResult = await otpProvider.sendOtp(phone);

      expect(sendResult.success).toBe(true);
      expect(sendResult.codeForDemo).toBeDefined();

      const verifyResult = await otpProvider.verifyOtp(phone, sendResult.codeForDemo!);
      expect(verifyResult).toBe(true);
    });

    it("rejects incorrect OTP codes", async () => {
      const phone = "+213555112233";
      await otpProvider.sendOtp(phone);

      const verifyResult = await otpProvider.verifyOtp(phone, "000000");
      expect(verifyResult).toBe(false);
    });
  });

  describe("Role-Based Access Control (RBAC)", () => {
    it("allows authorized roles without error", () => {
      expect(() => {
        AuthService.requireRole(UserRole.ADMIN, [UserRole.ADMIN, UserRole.FINANCE]);
      }).not.toThrow();

      expect(() => {
        AuthService.requireRole(UserRole.BUREAU_STAFF, [UserRole.BUREAU_STAFF, UserRole.ADMIN]);
      }).not.toThrow();
    });

    it("throws ForbiddenError when user role is not permitted", () => {
      expect(() => {
        AuthService.requireRole(UserRole.USER, [UserRole.ADMIN, UserRole.FINANCE]);
      }).toThrow(ForbiddenError);

      expect(() => {
        AuthService.requireRole(UserRole.MODERATOR, [UserRole.FINANCE]);
      }).toThrow(ForbiddenError);
    });
  });
});
