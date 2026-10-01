import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { RegisterInput, LoginInput } from "./schemas";
import { createSession, revokeCurrentSession, getCurrentSession } from "./session";
import { getPhoneOtpProvider } from "./phone-otp";
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { UserRole, TrustLevel } from "@prisma/client";
import { AuthenticatedUser } from "./types";

export class AuthService {
  /**
   * Register a new user with email and password.
   */
  static async register(
    input: RegisterInput,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: AuthenticatedUser }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ValidationError("An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        preferredLanguage: input.preferredLanguage,
        preferredCurrencyCode: input.preferredCurrencyCode,
        role: UserRole.USER,
        status: "ACTIVE",
        trustLevel: TrustLevel.UNVERIFIED,
      },
    });

    // Create session & HTTP-only cookie
    await createSession(user.id, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        trustLevel: user.trustLevel,
        preferredLanguage: user.preferredLanguage,
        preferredCurrencyCode: user.preferredCurrencyCode,
      },
    };
  }

  /**
   * Login user with credentials.
   */
  static async login(
    input: LoginInput,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: AuthenticatedUser }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      throw new ForbiddenError(`Your account has been ${user.status.toLowerCase()}`);
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    await createSession(user.id, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        trustLevel: user.trustLevel,
        preferredLanguage: user.preferredLanguage,
        preferredCurrencyCode: user.preferredCurrencyCode,
      },
    };
  }

  /**
   * Logout current user.
   */
  static async logout(): Promise<void> {
    await revokeCurrentSession();
  }

  /**
   * Send phone OTP.
   */
  static async sendPhoneOtp(phone: string) {
    const provider = getPhoneOtpProvider();
    return provider.sendOtp(phone);
  }

  /**
   * Verify phone OTP and upgrade trust level to CONTACT_VERIFIED if unverified.
   */
  static async verifyPhoneOtp(userId: string, phone: string, code: string) {
    const provider = getPhoneOtpProvider();
    const isValid = await provider.verifyOtp(phone, code);

    if (!isValid) {
      throw new ValidationError("Invalid or expired verification code");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User", userId);
    }

    // Determine new trust level: if UNVERIFIED, upgrade to CONTACT_VERIFIED
    const newTrustLevel =
      user.trustLevel === TrustLevel.UNVERIFIED
        ? TrustLevel.CONTACT_VERIFIED
        : user.trustLevel;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phone.trim(),
        phoneVerifiedAt: new Date(),
        trustLevel: newTrustLevel,
      },
    });

    return {
      success: true,
      trustLevel: updatedUser.trustLevel,
    };
  }

  /**
   * Verify email address.
   */
  static async verifyEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const newTrustLevel =
      user.trustLevel === TrustLevel.UNVERIFIED && user.phoneVerifiedAt
        ? TrustLevel.CONTACT_VERIFIED
        : user.trustLevel;

    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        trustLevel: newTrustLevel,
      },
    });
  }

  /**
   * Enforce Role-Based Access Control (RBAC).
   */
  static requireRole(userRole: UserRole, allowedRoles: UserRole[]): void {
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError("You do not have permission to access this resource");
    }
  }

  /**
   * Get current authenticated user profile.
   */
  static async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User", userId);
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      trustLevel: user.trustLevel,
      preferredLanguage: user.preferredLanguage,
      preferredCurrencyCode: user.preferredCurrencyCode,
    };
  }
}
