import { NextResponse } from "next/server";
import {
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
    return NextResponse.redirect(issuerLogin);
  } catch {
    return NextResponse.json({ ok: false, error: "OPERATOR_AUTH_CONFIG_UNAVAILABLE" }, { status: 500 });
  }
}
