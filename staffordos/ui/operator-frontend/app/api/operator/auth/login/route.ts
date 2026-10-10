import { NextResponse } from "next/server";
import { operatorAuthConfigFromEnv, validateOperatorAuthConfig } from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function GET() {
  try {
    const config = validateOperatorAuthConfig(operatorAuthConfigFromEnv(process.env));
    return NextResponse.redirect(new URL("/login", config.issuerBaseUrl));
  } catch {
    return NextResponse.json({ ok: false, error: "OPERATOR_AUTH_CONFIG_UNAVAILABLE" }, { status: 500 });
  }
}
