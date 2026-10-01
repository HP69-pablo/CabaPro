import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/service";
import { getCurrentSession } from "@/modules/auth/session";
import { phoneOtpRequestSchema, phoneOtpVerifySchema } from "@/modules/auth/schemas";
import { AppError, UnauthorizedError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      throw new UnauthorizedError("You must be logged in to verify your phone");
    }

    const body = await req.json();

    // If 'code' is present, verify code; otherwise, send code
    if (body.code) {
      const validated = phoneOtpVerifySchema.parse(body);
      const result = await AuthService.verifyPhoneOtp(session.userId, validated.phone, validated.code);
      return NextResponse.json({ success: true, trustLevel: result.trustLevel });
    } else {
      const validated = phoneOtpRequestSchema.parse(body);
      const result = await AuthService.sendPhoneOtp(validated.phone);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
