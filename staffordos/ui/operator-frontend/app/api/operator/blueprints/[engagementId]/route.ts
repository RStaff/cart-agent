import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  authorizeStaffordOsOperatorRead,
  operatorAuthConfigFromEnv,
  operatorAuthorizationFailureBody,
} from "../../../../../lib/operator/staffordosOperatorSession";
import {
  BLUEPRINT_ONBOARDING_PERMISSION,
  blueprintOperatorErrorStatus,
  createBlueprintReadRequest,
} from "../../../../../lib/operator/blueprintOnboardingOperator.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ engagementId: string }> }) {
  const config = operatorAuthConfigFromEnv(process.env);
  const jar = await cookies();
  const authorization = await authorizeStaffordOsOperatorRead(
    jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "",
    BLUEPRINT_ONBOARDING_PERMISSION,
    config,
  );
  if (!authorization.ok) return NextResponse.json(operatorAuthorizationFailureBody(authorization), { status: authorization.status });

  try {
    const { engagementId } = await context.params;
    const request = createBlueprintReadRequest({
      baseUrl: process.env.STAFFORDOS_INTAKE_API_URL,
      serviceKey: process.env.INTERNAL_API_KEY,
      operatorSubject: authorization.session.subject,
      permission: BLUEPRINT_ONBOARDING_PERMISSION,
      engagementId,
    });
    const response = await fetch(request.url, { headers: request.headers, cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ ok: false, error: body.error || "BLUEPRINT_ONBOARDING_SOURCE_UNAVAILABLE" }, { status: response.status >= 400 && response.status < 500 ? response.status : 503 });
    return NextResponse.json(body);
  } catch (error) {
    const code = String((error as any)?.code || "BLUEPRINT_ONBOARDING_SOURCE_UNAVAILABLE");
    return NextResponse.json({ ok: false, error: code }, { status: blueprintOperatorErrorStatus(code) });
  }
}
