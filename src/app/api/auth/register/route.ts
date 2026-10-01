import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/service";
import { registerSchema } from "@/modules/auth/schemas";
import { AppError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;

    const result = await AuthService.register(validated, userAgent, ipAddress);

    return NextResponse.json({ success: true, user: result.user }, { status: 201 });
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
