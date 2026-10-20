import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { STAFFORDOS_OPERATOR_SESSION_COOKIE, authorizeStaffordOsOperatorRead, operatorAuthConfigFromEnv, operatorAuthorizationFailureBody } from "../../../../../../lib/operator/staffordosOperatorSession";

export async function GET(request: Request, context: { params: Promise<{ engagementId: string }> }) {
  const config = operatorAuthConfigFromEnv(process.env);
  const jar = await cookies();
  const authorization = await authorizeStaffordOsOperatorRead(jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "", "staffordos.revenue_operations.write", config);
  if (!authorization.ok) return NextResponse.json(operatorAuthorizationFailureBody(authorization), { status: authorization.status });
  const { engagementId } = await context.params;
  try {
    const base = String(process.env.STAFFORDOS_INTAKE_API_URL || "").trim().replace(/\/$/, "");
    const key = String(process.env.INTERNAL_API_KEY || "").trim();
    if (!base || !key) return NextResponse.json({ ok: false, error: "BLUEPRINT_PACKAGE_SOURCE_UNCONFIGURED" }, { status: 503 });
    const snapshotId = new URL(request.url).searchParams.get("snapshotId") || "";
    const response = await fetch(`${base}/api/staffordos/blueprint-engagements/${encodeURIComponent(engagementId)}/package${snapshotId ? `/${encodeURIComponent(snapshotId)}` : ""}`, { headers: { "x-internal-api-key": key, "x-staffordos-operator-subject": authorization.session.subject, "x-staffordos-operator-permission": "staffordos.revenue_operations.write" }, cache: "no-store" });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch { return NextResponse.json({ ok: false, error: "BLUEPRINT_PACKAGE_SOURCE_UNAVAILABLE" }, { status: 503 }); }
}
