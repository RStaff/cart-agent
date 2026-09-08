import { NextResponse } from "next/server";
import {
  browserBindingCookieOptions,
  createStaffordOsOperatorBrowserBinding,
  STAFFORDOS_OPERATOR_BROWSER_BINDING_COOKIE,
  operatorAuthConfigFromEnv,
  resolveStaffordOsOperatorReturnPath,
  validateOperatorAuthConfig,
} from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const config = validateOperatorAuthConfig(operatorAuthConfigFromEnv(process.env));
    const returnTo = resolveStaffordOsOperatorReturnPath(
      new URL(request.url).searchParams.get("returnTo"),
      request.headers.get("referer"),
      config.frontendOrigin,
    );
    const issuerLogin = new URL("/login", config.issuerBaseUrl);
    if (returnTo) issuerLogin.searchParams.set("returnTo", returnTo);
    const browserBinding = createStaffordOsOperatorBrowserBinding();
    issuerLogin.searchParams.set("browserChallenge", browserBinding.challenge);
    const response = NextResponse.redirect(issuerLogin);
    response.cookies.set(STAFFORDOS_OPERATOR_BROWSER_BINDING_COOKIE, browserBinding.verifier, browserBindingCookieOptions(config));
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "OPERATOR_AUTH_CONFIG_UNAVAILABLE" }, { status: 500 });
  }
}
