import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  destroyStaffordOsOperatorSession,
  operatorAuthConfigFromEnv,
} from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function POST() {
  try {
    const config = operatorAuthConfigFromEnv(process.env);
    const jar = await cookies();
    const cookieValue = jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "";
    const result = destroyStaffordOsOperatorSession(cookieValue, config);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(STAFFORDOS_OPERATOR_SESSION_COOKIE, "", result.cookieOptions);
    return response;
  } catch {
    return NextResponse.json({ ok: true });
  }
}
