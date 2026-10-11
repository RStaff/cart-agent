import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  destroyStaffordOsOperatorSession,
  operatorAuthConfigFromEnv,
} from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function POST() {
  const clearCookie = (response: NextResponse) => {
    response.cookies.set(STAFFORDOS_OPERATOR_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  };
  try {
    const config = operatorAuthConfigFromEnv(process.env);
    const jar = await cookies();
    const cookieValue = jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "";
    const result = await destroyStaffordOsOperatorSession(cookieValue, config);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(STAFFORDOS_OPERATOR_SESSION_COOKIE, "", result.cookieOptions);
    return response;
  } catch {
    return clearCookie(NextResponse.json({ ok: true }));
  }
}
