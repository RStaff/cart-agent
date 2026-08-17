import { NextResponse } from "next/server";
import { careerP0Store, CAREEROS_P0_COOKIE, sessionCookieOptions, customerMutationAllowed } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const cookie = request.headers.get("cookie")?.match(new RegExp(`${CAREEROS_P0_COOKIE}=([^;]+)`))?.[1];
  if (cookie) await careerP0Store.destroySession(cookie);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CAREEROS_P0_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
