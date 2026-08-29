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
    const { session, cookieValue, cookieOptions } = createStaffordOsOperatorSession(verified, config);
    const response = NextResponse.json({
      ok: true,
      operatorSession: true,
      authority: "staffordos.operator.frontend.v1",
      expiresAt: session.expiresAt,
    });
    response.cookies.set(STAFFORDOS_OPERATOR_SESSION_COOKIE, cookieValue, cookieOptions);
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "OPERATOR_ASSERTION_UNTRUSTED" }, { status: 401 });
  }
}
