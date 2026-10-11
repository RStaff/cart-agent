import { NextResponse } from "next/server";
import {
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  createStaffordOsOperatorSession,
  fetchStaffordOsOperatorPublicKey,
  operatorAuthConfigFromEnv,
  redeemStaffordOsIssuerHandoffCode,
  verifyStaffordOsOperatorAssertion,
} from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code") || "";
    if (!code) return NextResponse.json({ ok: false, error: "OPERATOR_HANDOFF_CODE_MISSING" }, { status: 400 });

    const config = operatorAuthConfigFromEnv(process.env);
    const assertion = await redeemStaffordOsIssuerHandoffCode(code, config);
    const publicKeyPem = await fetchStaffordOsOperatorPublicKey(config);
    const verified = verifyStaffordOsOperatorAssertion(assertion, publicKeyPem, config);
    const { session, cookieValue, cookieOptions } = await createStaffordOsOperatorSession(verified, config);
    const response = NextResponse.json({
      ok: true,
      operatorSession: true,
      authority: "staffordos.operator.frontend.v1",
      expiresAt: session.expiresAt,
    });
    response.cookies.set(STAFFORDOS_OPERATOR_SESSION_COOKIE, cookieValue, cookieOptions);
    const returnTo = url.searchParams.get("returnTo");
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      const target = new URL(returnTo, url.origin);
      if (target.origin === url.origin) {
        const redirect = NextResponse.redirect(target);
        redirect.cookies.set(STAFFORDOS_OPERATOR_SESSION_COOKIE, cookieValue, cookieOptions);
        return redirect;
      }
    }
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "OPERATOR_ASSERTION_UNTRUSTED" }, { status: 401 });
  }
}
