import { NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/service";

export async function POST() {
  await AuthService.logout();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
