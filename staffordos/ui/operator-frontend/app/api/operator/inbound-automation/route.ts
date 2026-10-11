import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  REVENUE_OPERATIONS_PERMISSION,
} from "../../../../../../leads/staffordmedia_revenue_transaction_v1.mjs";
import {
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  authorizeStaffordOsOperatorRead,
  operatorAuthConfigFromEnv,
  operatorAuthorizationFailureBody,
} from "../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function GET() {
  const config = operatorAuthConfigFromEnv(process.env);
  const jar = await cookies();
  const authorization = await authorizeStaffordOsOperatorRead(
    jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "",
    REVENUE_OPERATIONS_PERMISSION,
    config,
  );
  if (!authorization.ok) return NextResponse.json(operatorAuthorizationFailureBody(authorization), { status: authorization.status });

  const baseUrl = String(process.env.STAFFORDOS_INTAKE_API_URL || "").trim().replace(/\/$/, "");
  const serviceKey = String(process.env.INTERNAL_API_KEY || "").trim();
  if (!baseUrl || !serviceKey) return NextResponse.json({ ok: false, error: "INQUIRY_REVIEW_SOURCE_UNCONFIGURED" }, { status: 503 });
  try {
    const response = await fetch(`${baseUrl}/api/staffordos/automation-inquiries`, {
      headers: { "x-internal-api-key": serviceKey, Accept: "application/json" },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ ok: false, error: "INQUIRY_REVIEW_SOURCE_UNAVAILABLE" }, { status: 503 });
    return NextResponse.json({ ok: true, inquiries: Array.isArray(body.inquiries) ? body.inquiries : [] });
  } catch {
    return NextResponse.json({ ok: false, error: "INQUIRY_REVIEW_SOURCE_UNAVAILABLE" }, { status: 503 });
  }
}
