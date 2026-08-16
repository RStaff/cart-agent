import { NextResponse } from "next/server";
import { careerP0Store, CAREEROS_P0_COOKIE, sessionCookieOptions } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie")?.match(new RegExp(`${CAREEROS_P0_COOKIE}=([^;]+)`))?.[1];
  if (cookie) await careerP0Store.destroySession(cookie);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CAREEROS_P0_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
