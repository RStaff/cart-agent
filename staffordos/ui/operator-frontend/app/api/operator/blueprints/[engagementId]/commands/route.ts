import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  authorizeStaffordOsOperatorRead,
  operatorAuthConfigFromEnv,
  operatorAuthorizationFailureBody,
} from "../../../../../../lib/operator/staffordosOperatorSession";
import {
  OPERATOR_WRITE_DENIED_STATUS,
  evaluateOperatorWriteIsolation,
  operatorWriteDeniedResponseBody,
} from "../../../../../../lib/operator/operatorWriteIsolation";
import {
  BLUEPRINT_ONBOARDING_PERMISSION,
  blueprintOperatorErrorStatus,
  createBlueprintCommandRequest,
} from "../../../../../../lib/operator/blueprintOnboardingOperator.mjs";

export const runtime = "nodejs";

export async function POST(req: Request, context: { params: Promise<{ engagementId: string }> }) {
  const writeGate = evaluateOperatorWriteIsolation({ request: req, env: process.env });
  if (!writeGate.allowed) return NextResponse.json(operatorWriteDeniedResponseBody(writeGate), { status: OPERATOR_WRITE_DENIED_STATUS });

  const config = operatorAuthConfigFromEnv(process.env);
  const jar = await cookies();
  const authorization = await authorizeStaffordOsOperatorRead(
    jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "",
    BLUEPRINT_ONBOARDING_PERMISSION,
    config,
  );
  if (!authorization.ok) return NextResponse.json(operatorAuthorizationFailureBody(authorization), { status: authorization.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "BLUEPRINT_ONBOARDING_COMMAND_INVALID" }, { status: 400 });
  }

  try {
    const { engagementId } = await context.params;
    const request = createBlueprintCommandRequest({
      baseUrl: process.env.STAFFORDOS_INTAKE_API_URL,
      serviceKey: process.env.INTERNAL_API_KEY,
      operatorSubject: authorization.session.subject,
      permission: BLUEPRINT_ONBOARDING_PERMISSION,
      engagementId,
      expectedVersion: body?.expectedVersion,
      command: body?.command,
      data: body?.data,
    });
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ ok: false, error: result.error || "BLUEPRINT_ONBOARDING_SAVE_FAILED" }, { status: response.status >= 400 && response.status < 500 ? response.status : 503 });
    return NextResponse.json(result);
  } catch (error) {
    const code = String((error as any)?.code || "BLUEPRINT_ONBOARDING_SOURCE_UNAVAILABLE");
    return NextResponse.json({ ok: false, error: code }, { status: blueprintOperatorErrorStatus(code) });
  }
}
