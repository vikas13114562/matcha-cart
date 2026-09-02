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
    const parsed = loginSchema.safeParse(await request.json());
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    if (!parsed.success || !username || !password || !safeEqual(parsed.data.username, username) || !safeEqual(parsed.data.password, password)) {
      return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, await createSession(), sessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to sign in. Please try again." }, { status: 500 });
  }
}
