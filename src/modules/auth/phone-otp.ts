import { PhoneOtpResult } from "./types";
import { getEnv } from "@/lib/env";

export interface PhoneOtpProvider {
  sendOtp(phone: string): Promise<PhoneOtpResult>;
  verifyOtp(phone: string, candidateCode: string): Promise<boolean>;
}

// In-memory OTP storage for development & demo environments
interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpRecord>();

export class DemoPhoneOtpProvider implements PhoneOtpProvider {
  async sendOtp(phone: string): Promise<PhoneOtpResult> {
    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    // In demo mode or testing, default to "123456" or random 6 digits
    const code = getEnv().DEMO_MODE ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalizedPhone, {
      code,
      expiresAt,
      attempts: 0,
    });

    return {
      success: true,
      message: `OTP sent successfully to ${normalizedPhone}`,
      codeForDemo: getEnv().DEMO_MODE ? code : undefined,
    };
  }

  async verifyOtp(phone: string, candidateCode: string): Promise<boolean> {
    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    const record = otpStore.get(normalizedPhone);

    if (!record) {
      return false;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedPhone);
      return false;
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      otpStore.delete(normalizedPhone);
      return false;
    }

    if (record.code === candidateCode.trim()) {
      otpStore.delete(normalizedPhone);
      return true;
    }

    return false;
  }
}

// Factory to retrieve active OTP provider
export function getPhoneOtpProvider(): PhoneOtpProvider {
  return new DemoPhoneOtpProvider();
}
