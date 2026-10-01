import { NextResponse } from "next/server";
import { getCurrentSession } from "@/modules/auth/session";
import { AuthService } from "@/modules/auth/service";
import { UnauthorizedError, AppError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      throw new UnauthorizedError();
    }

    const user = await AuthService.getProfile(session.userId);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
