import { NextResponse } from "next/server";
import { careerP0Store, CAREEROS_P0_COOKIE, sessionCookieOptions, customerMutationAllowed, allowCustomerAuthRequest } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!customerMutationAllowed(request) || !(await allowCustomerAuthRequest("login"))) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  try {
    const body = await request.json();
    const session = await careerP0Store.login({ email: body?.email, password: body?.password });
    const response = NextResponse.json({ ok: true, user: session.user, tenant: session.tenant });
    response.cookies.set(CAREEROS_P0_COOKIE, session.sessionId, sessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }
}
