import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { STAFFORDOS_OPERATOR_SESSION_COOKIE, authorizeStaffordOsOperatorRead, operatorAuthConfigFromEnv, operatorAuthorizationFailureBody } from "../../../../../../../lib/operator/staffordosOperatorSession";
import { evaluateOperatorWriteIsolation, OPERATOR_WRITE_DENIED_STATUS, operatorWriteDeniedResponseBody } from "../../../../../../../lib/operator/operatorWriteIsolation";

export async function POST(request: Request, context: { params: Promise<{ engagementId: string }> }) {
  const writeGate = evaluateOperatorWriteIsolation({ request, env: process.env });
  if (!writeGate.allowed) return NextResponse.json(operatorWriteDeniedResponseBody(writeGate), { status: OPERATOR_WRITE_DENIED_STATUS });
  const config = operatorAuthConfigFromEnv(process.env);
  const jar = await cookies();
  const authorization = await authorizeStaffordOsOperatorRead(jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "", "staffordos.revenue_operations.write", config);
  if (!authorization.ok) return NextResponse.json(operatorAuthorizationFailureBody(authorization), { status: authorization.status });
  const { engagementId } = await context.params;
  try {
    const base = String(process.env.STAFFORDOS_INTAKE_API_URL || "").trim().replace(/\/$/, "");
    const key = String(process.env.INTERNAL_API_KEY || "").trim();
    if (!base || !key) return NextResponse.json({ ok: false, error: "BLUEPRINT_PACKAGE_SOURCE_UNCONFIGURED" }, { status: 503 });
    const body = await request.json();
    const response = await fetch(`${base}/api/staffordos/blueprint-engagements/${encodeURIComponent(engagementId)}/package/commands`, { method: "POST", headers: { "content-type": "application/json", "x-internal-api-key": key, "x-staffordos-operator-subject": authorization.session.subject, "x-staffordos-operator-permission": "staffordos.revenue_operations.write" }, body: JSON.stringify(body), cache: "no-store" });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch { return NextResponse.json({ ok: false, error: "BLUEPRINT_PACKAGE_SOURCE_UNAVAILABLE" }, { status: 503 }); }
}
