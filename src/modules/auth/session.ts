import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserSessionPayload } from "./types";
import { UserRole, TrustLevel } from "@prisma/client";

export const SESSION_COOKIE_NAME = "caba_session";
export const SESSION_DURATION_DAYS = 30;

/**
 * Generate a cryptographically secure random session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash session token for secure database storage.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Create a session in the database and set the HTTP-only secure cookie.
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Validate active session from HTTP-only cookie.
 */
export async function getCurrentSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          status: true,
          trustLevel: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  if (session.user.status !== "ACTIVE") {
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.user.id,
    role: session.user.role,
    trustLevel: session.user.trustLevel,
    expiresAt: session.expiresAt,
  };
}

/**
 * Revoke active session and clear cookie.
 */
export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}
