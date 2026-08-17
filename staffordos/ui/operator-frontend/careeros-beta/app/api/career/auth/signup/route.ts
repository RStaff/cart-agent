import { NextResponse } from "next/server";
import { careerP0Store, CAREEROS_P0_COOKIE, sessionCookieOptions, customerMutationAllowed, allowCustomerAuthRequest } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!customerMutationAllowed(request) || !(await allowCustomerAuthRequest("signup"))) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  try {
    const body = await request.json();
    const session = await careerP0Store.createAccount({ email: body?.email, password: body?.password, displayName: body?.displayName, inviteToken: body?.inviteToken });
    const response = NextResponse.json({ ok: true, user: session.user, tenant: session.tenant }, { status: 201 });
    response.cookies.set(CAREEROS_P0_COOKIE, session.sessionId, sessionCookieOptions());
    return response;
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : "ACCOUNT_CREATE_FAILED";
    return NextResponse.json({ ok: false, error: code === "ACCOUNT_EXISTS" ? "ACCOUNT_CREATE_FAILED" : code || "ACCOUNT_CREATE_FAILED" }, { status: 400 });
  }
}
