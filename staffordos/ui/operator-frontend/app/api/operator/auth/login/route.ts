import { NextResponse } from "next/server";
import { operatorAuthConfigFromEnv, validateOperatorAuthConfig } from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  try {
    const target = new URL(value, "http://staffordos.local");
    return target.origin === "http://staffordos.local" ? `${target.pathname}${target.search}${target.hash}` : "";
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  try {
    const config = validateOperatorAuthConfig(operatorAuthConfigFromEnv(process.env));
    const issuerLogin = new URL("/login", config.issuerBaseUrl);
    const returnTo = safeReturnTo(new URL(request.url).searchParams.get("returnTo"));
    if (returnTo) issuerLogin.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(issuerLogin);
  } catch {
    return NextResponse.json({ ok: false, error: "OPERATOR_AUTH_CONFIG_UNAVAILABLE" }, { status: 500 });
  }
}
