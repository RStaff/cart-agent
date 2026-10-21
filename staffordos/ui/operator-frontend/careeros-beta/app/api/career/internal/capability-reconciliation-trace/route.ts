import { NextResponse } from "next/server";
import { currentCareerContext } from "../../../../../lib/career/careerP0Auth";
import { getCapabilityDerivationComparison, getCapabilityProfile } from "../../../../../lib/career/careerP0Product.mjs";
import { sanitizeCapabilityDerivationTrace, sanitizeCapabilityExecutionTrace, sanitizeCapabilityFactShapeComparison, sanitizeCapabilityReconciliationTrace } from "../../../../../lib/career/capabilityTrace.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

function traceFrom(error: unknown) {
  return error && typeof error === "object" && "reconciliationTrace" in error
    ? sanitizeCapabilityReconciliationTrace((error as { reconciliationTrace?: unknown[] }).reconciliationTrace)
    : null;
}

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return response({ ok: false, error: "UNAUTHORIZED" }, 401);

  try {
    const executionTrace = {};
    const [profile, comparison] = await Promise.all([
      getCapabilityProfile(context, { includeTrace: true, executionTrace }),
      getCapabilityDerivationComparison(context),
    ]);
    const tracedProfile = profile as typeof profile & { executionTrace?: unknown };
    return response({ ok: true, comparison: { ...comparison, factShapeComparison: sanitizeCapabilityFactShapeComparison(comparison) }, canonicalExecution: sanitizeCapabilityExecutionTrace(tracedProfile.executionTrace || executionTrace), derivation: sanitizeCapabilityDerivationTrace(tracedProfile.derivationTrace as unknown), trace: sanitizeCapabilityReconciliationTrace(tracedProfile.reconciliationTrace) });
  } catch (error) {
    return response({ ok: false, error: "CAPABILITY_RECONCILIATION_TRACE_FAILED", trace: traceFrom(error) }, 400);
  }
}
