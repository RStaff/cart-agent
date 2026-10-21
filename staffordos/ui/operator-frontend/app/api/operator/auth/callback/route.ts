import { NextResponse } from "next/server";
import {
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  STAFFORDOS_OPERATOR_BROWSER_BINDING_COOKIE,
  browserBindingCookieOptions,
  STAFFORDOS_OPERATOR_DEFAULT_RETURN_PATH,
  createStaffordOsOperatorSession,
  fetchStaffordOsOperatorPublicKey,
  operatorAuthConfigFromEnv,
  redeemStaffordOsIssuerHandoffCode,
  readStaffordOsOperatorBrowserBindingCookie,
  verifyStaffordOsOperatorAssertion,
  validateStaffordOsOperatorReturnPath,
} from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code") || "";
    if (!code) return NextResponse.json({ ok: false, error: "OPERATOR_HANDOFF_CODE_MISSING" }, { status: 400 });

    const config = operatorAuthConfigFromEnv(process.env);
    const browserVerifier = readStaffordOsOperatorBrowserBindingCookie(request.headers.get("cookie"));
    if (!browserVerifier) return NextResponse.json({ ok: false, error: "OPERATOR_BROWSER_BINDING_MISSING" }, { status: 401 });
    const handoff = await redeemStaffordOsIssuerHandoffCode(code, config, browserVerifier);
    const publicKeyPem = await fetchStaffordOsOperatorPublicKey(config);
    const verified = verifyStaffordOsOperatorAssertion(handoff.assertion, publicKeyPem, config);
    const { session, cookieValue, cookieOptions } = createStaffordOsOperatorSession(verified, config);
    const returnTo = validateStaffordOsOperatorReturnPath(handoff.returnTo) || STAFFORDOS_OPERATOR_DEFAULT_RETURN_PATH;
    const response = NextResponse.redirect(new URL(returnTo, `${config.frontendOrigin}/`));
    response.cookies.set(STAFFORDOS_OPERATOR_SESSION_COOKIE, cookieValue, cookieOptions);
    response.cookies.set(STAFFORDOS_OPERATOR_BROWSER_BINDING_COOKIE, "", browserBindingCookieOptions(config, 0));
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "OPERATOR_ASSERTION_UNTRUSTED" }, { status: 401 });
  }
}
