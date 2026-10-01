import { UserRole, UserStatus, TrustLevel } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  trustLevel: TrustLevel;
  preferredLanguage: string;
  preferredCurrencyCode: string;
}

export interface UserSessionPayload {
  sessionId: string;
  userId: string;
  role: UserRole;
  trustLevel: TrustLevel;
  expiresAt: Date;
}

export interface PhoneOtpResult {
  success: boolean;
  message: string;
  codeForDemo?: string; // Only provided when DEMO_MODE=true for automated tests & UI display
}
