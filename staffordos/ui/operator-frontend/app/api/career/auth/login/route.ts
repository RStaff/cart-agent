import { NextResponse } from "next/server";
import { careerP0Store, CAREEROS_P0_COOKIE, sessionCookieOptions } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await careerP0Store.login({ email: body?.email, password: body?.password });
    const response = NextResponse.json({ ok: true, user: session.user, tenant: session.tenant });
    response.cookies.set(CAREEROS_P0_COOKIE, session.sessionId, sessionCookieOptions());
    return response;
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : "INVALID_CREDENTIALS";
    return NextResponse.json({ ok: false, error: code || "INVALID_CREDENTIALS" }, { status: 401 });
  }
}
