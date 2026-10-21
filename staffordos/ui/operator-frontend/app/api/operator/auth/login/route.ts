import { NextResponse } from "next/server";
import {
  browserBindingCookieOptions,
  createStaffordOsOperatorBrowserBinding,
  createStaffordOsOperatorCanonicalEntryToken,
  STAFFORDOS_OPERATOR_BROWSER_BINDING_COOKIE,
  operatorAuthConfigFromEnv,
  resolveStaffordOsOperatorReturnPath,
  validateOperatorAuthConfig,
  verifyStaffordOsOperatorCanonicalEntryToken,
} from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const config = validateOperatorAuthConfig(operatorAuthConfigFromEnv(process.env));
    const requestedReturnTo = resolveStaffordOsOperatorReturnPath(
      new URL(request.url).searchParams.get("returnTo"),
      request.headers.get("referer"),
      config.frontendOrigin,
    );
    const requestUrl = new URL(request.url);
    const canonicalEntry = requestUrl.searchParams.get("canonicalEntry");
    if (canonicalEntry) {
      const verifiedEntry = verifyStaffordOsOperatorCanonicalEntryToken(canonicalEntry, config.handoffSharedSecret);
      if (!verifiedEntry) return NextResponse.json({ ok: false, error: "OPERATOR_CANONICAL_ENTRY_INVALID" }, { status: 400 });
      const browserBinding = createStaffordOsOperatorBrowserBinding();
      const issuerLogin = new URL("/login", config.issuerBaseUrl);
      if (verifiedEntry.returnTo) issuerLogin.searchParams.set("returnTo", verifiedEntry.returnTo);
      issuerLogin.searchParams.set("browserChallenge", browserBinding.challenge);
      const response = NextResponse.redirect(issuerLogin);
      response.cookies.set(STAFFORDOS_OPERATOR_BROWSER_BINDING_COOKIE, browserBinding.verifier, browserBindingCookieOptions(config));
      return response;
    }
    const canonicalLogin = new URL("/api/operator/auth/login", `${config.frontendOrigin}/`);
    canonicalLogin.searchParams.set("canonicalEntry", createStaffordOsOperatorCanonicalEntryToken(requestedReturnTo, config.handoffSharedSecret));
    return NextResponse.redirect(canonicalLogin);
  } catch {
    return NextResponse.json({ ok: false, error: "OPERATOR_AUTH_CONFIG_UNAVAILABLE" }, { status: 500 });
  }
}
