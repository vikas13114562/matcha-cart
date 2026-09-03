import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export function safeEqual(value: string, expected: string) {
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    if (!username || !password) {
      return NextResponse.json({ message: "Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in the deployment environment, then redeploy." }, { status: 503 });
    }
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      return NextResponse.json({ message: "Admin sessions are not configured. Set SESSION_SECRET to a random value of at least 32 characters in the deployment environment, then redeploy." }, { status: 503 });
    }
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !safeEqual(parsed.data.username, username) || !safeEqual(parsed.data.password, password)) {
      return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, await createSession(), sessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to sign in. Please try again." }, { status: 500 });
  }
}
