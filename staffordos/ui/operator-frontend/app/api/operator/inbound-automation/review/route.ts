import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REVENUE_OPERATIONS_PERMISSION } from "../../../../../../../leads/staffordmedia_revenue_transaction_v1.mjs";
import {
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  authorizeStaffordOsOperatorRead,
  operatorAuthConfigFromEnv,
  operatorAuthorizationFailureBody,
} from "../../../../../lib/operator/staffordosOperatorSession";
import {
  OPERATOR_WRITE_DENIED_STATUS,
  evaluateOperatorWriteIsolation,
  operatorWriteDeniedResponseBody,
} from "../../../../../lib/operator/operatorWriteIsolation";
import { createInboundReviewRequest, INBOUND_REVIEW_PERMISSION } from "../../../../../lib/operator/inboundAutomationReview.mjs";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const writeGate = evaluateOperatorWriteIsolation({ request: req, env: process.env });
  if (!writeGate.allowed) return NextResponse.json(operatorWriteDeniedResponseBody(writeGate), { status: OPERATOR_WRITE_DENIED_STATUS });

  const config = operatorAuthConfigFromEnv(process.env);
  const jar = await cookies();
  const authorization = await authorizeStaffordOsOperatorRead(
    jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "",
    REVENUE_OPERATIONS_PERMISSION,
    config,
  );
  if (!authorization.ok) return NextResponse.json(operatorAuthorizationFailureBody(authorization), { status: authorization.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INQUIRY_REVIEW_PAYLOAD_INVALID" }, { status: 400 });
  }
  try {
    if (body?.reviewed !== true) return NextResponse.json({ ok: false, error: "INQUIRY_REVIEW_INPUT_INVALID" }, { status: 400 });
    const request = createInboundReviewRequest({
      baseUrl: process.env.STAFFORDOS_INTAKE_API_URL,
      serviceKey: process.env.INTERNAL_API_KEY,
      operatorSubject: authorization.session.subject,
      permission: INBOUND_REVIEW_PERMISSION,
      inquiryId: body?.inquiryId,
      nextAction: body?.nextAction,
    });
    const response = await fetch(request.url, {
      method: "PATCH",
      headers: request.headers,
      body: request.body,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ ok: false, error: result.error || "INQUIRY_REVIEW_FAILED" }, { status: response.status >= 400 && response.status < 500 ? response.status : 503 });
    return NextResponse.json({ ok: true, inquiry: result.inquiry });
  } catch (error) {
    const code = String((error as any)?.code || "INQUIRY_REVIEW_SOURCE_UNAVAILABLE");
    const status = code === "INQUIRY_REVIEW_INPUT_INVALID" ? 400 : code === "OPERATOR_IDENTITY_MISSING" || code === "OPERATOR_PERMISSION_MISSING" ? 403 : code === "INQUIRY_REVIEW_SOURCE_UNCONFIGURED" ? 503 : 503;
    return NextResponse.json({ ok: false, error: code }, { status });
  }
}
