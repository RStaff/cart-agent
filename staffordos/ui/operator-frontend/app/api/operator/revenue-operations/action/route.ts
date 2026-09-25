import path from "node:path";
import { pathToFileURL } from "node:url";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  BUSINESS_UNIT,
  CAMPAIGN_ID,
  OFFER_ID,
  REVENUE_OPERATIONS_PERMISSION,
  ROSS_APPROVER,
  TENANT_ID,
  createFileRepository,
  createRevenueOperationsService,
} from "../../../../../../../leads/staffordmedia_revenue_transaction_v1.mjs";
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

export const runtime = "nodejs";

const ROOT = path.resolve(process.cwd(), "../../..");
const repository = createFileRepository({
  statePath: path.join(ROOT, "staffordos/leads/staffordmedia_revenue_transactions_v1.json"),
  leadRegistryPath: path.join(ROOT, "staffordos/leads/lead_registry_v1.json"),
  eventPath: path.join(ROOT, "staffordos/leads/lead_events_v1.json"),
});

function responseError(error: unknown) {
  const code = String((error as { code?: string; message?: string })?.code || (error as { message?: string })?.message || "REVENUE_OPERATION_FAILED");
  return NextResponse.json({ ok: false, error: code }, { status: code === "TRANSACTION_NOT_FOUND" || code === "LEAD_NOT_FOUND" ? 404 : 409 });
}

export async function POST(req: Request) {
  const writeGate = evaluateOperatorWriteIsolation({ request: req, env: process.env });
  if (!writeGate.allowed) {
    return NextResponse.json(operatorWriteDeniedResponseBody(writeGate), { status: OPERATOR_WRITE_DENIED_STATUS });
  }

  try {
    const config = operatorAuthConfigFromEnv(process.env);
    const jar = await cookies();
    const cookieValue = jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "";
    const authorization = await authorizeStaffordOsOperatorRead(cookieValue, REVENUE_OPERATIONS_PERMISSION, config);
    if (!authorization.ok) {
      return NextResponse.json(operatorAuthorizationFailureBody(authorization), { status: authorization.status });
    }
    const rossSubject = String(process.env.STAFFORDOS_REVENUE_OPERATIONS_APPROVER_SUBJECT || "").trim();
    if (!rossSubject || authorization.session.subject !== rossSubject) {
      return NextResponse.json({ ok: false, error: "ROSS_APPROVER_REQUIRED" }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body?.action || "");
    if (action === "send" && process.env.STAFFORDOS_REAL_PROSPECT_SEND_ENABLED !== "1") {
      return NextResponse.json({ ok: false, error: "REAL_PROSPECT_SEND_DISABLED" }, { status: 403 });
    }
    const provider = action === "send"
      ? createRevenueOperationsServiceProvider(await import("../../../../../../../leads/resend_prospect_provider_v1.mjs"))
      : { send: async () => { throw new Error("REAL_PROSPECT_SEND_DISABLED"); } };
    const service = createRevenueOperationsService({ repository, provider });

    if (action === "create_draft") {
      return NextResponse.json({ ok: true, transaction: service.createDraft({
        leadId: body.leadId,
        businessUnit: BUSINESS_UNIT,
        offerId: OFFER_ID,
        campaignId: CAMPAIGN_ID,
        tenantId: TENANT_ID,
        recipient: body.recipient,
        sender: body.sender,
        subject: body.subject,
        body: body.body,
      }) });
    }
    if (action === "approve") {
      return NextResponse.json({ ok: true, transaction: service.approve({ transactionId: body.transactionId, contentHash: body.contentHash, approver: ROSS_APPROVER, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() }) });
    }
    if (action === "send") {
      return NextResponse.json({ ok: true, transaction: await service.send({ transactionId: body.transactionId, approvalId: body.approvalId, recipient: body.recipient, contentHash: body.contentHash }) });
    }
    if (action === "record_outcome") {
      return NextResponse.json({ ok: true, transaction: service.recordOutcome({ transactionId: body.transactionId, outcome: body.outcome, note: body.note, followUpAt: body.followUpAt }) });
    }
    return NextResponse.json({ ok: false, error: "ACTION_INVALID" }, { status: 400 });
  } catch (error) {
    return responseError(error);
  }
}

function createRevenueOperationsServiceProvider(module: { createResendProspectProvider: (options: { mailerModuleUrl: string }) => { send: (input: any) => Promise<any> } }) {
  return module.createResendProspectProvider({
    mailerModuleUrl: pathToFileURL(path.join(ROOT, "web/src/lib/mailer.js")).href,
  });
}
