import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(2, "First name must be at least 2 characters").trim(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").trim(),
  phone: z.string().min(8, "Phone number must be at least 8 digits").optional(),
  preferredLanguage: z.enum(["en", "fr", "ar"]).default("en"),
  preferredCurrencyCode: z.string().length(3).default("EUR"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const phoneOtpRequestSchema = z.object({
  phone: z.string().min(8, "Invalid phone number"),
});

export const phoneOtpVerifySchema = z.object({
  phone: z.string().min(8, "Invalid phone number"),
  code: z.string().length(6, "OTP code must be 6 digits"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PhoneOtpRequestInput = z.infer<typeof phoneOtpRequestSchema>;
export type PhoneOtpVerifyInput = z.infer<typeof phoneOtpVerifySchema>;
