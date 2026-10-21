import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";
import { answerCapability, getCapabilityProfile } from "../../../../lib/career/careerP0Product.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
function traceEnabled() { return process.env.CAREEROS_CAPABILITY_RECONCILIATION_TRACE === "true"; }

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return response({ ok: false, error: "UNAUTHORIZED" }, 401);
  try { return response({ ok: true, profile: await getCapabilityProfile(context, { includeTrace: traceEnabled() }) }); }
  catch (error) {
    const body: { ok: false; error: string; reconciliationTrace?: unknown[] } = { ok: false, error: error instanceof Error ? error.message : "CAPABILITIES_FAILED" };
    if (traceEnabled() && error && typeof error === "object" && "reconciliationTrace" in error) body.reconciliationTrace = (error as { reconciliationTrace?: unknown[] }).reconciliationTrace;
    return response(body, 400);
  }
}

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return response({ ok: false, error: "REQUEST_NOT_ALLOWED" }, 403);
  const context = await currentCareerContext();
  if (!context) return response({ ok: false, error: "UNAUTHORIZED" }, 401);
  try { return response({ ok: true, result: await answerCapability(context, await request.json()) }); }
  catch (error) { return response({ ok: false, error: error instanceof Error ? error.message : "CAPABILITY_DECISION_FAILED" }, 400); }
}
