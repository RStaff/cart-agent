import { NextResponse } from "next/server";
import { currentCareerContext } from "../../../../../lib/career/careerP0Auth";
import { getCapabilityDerivationComparison, getCapabilityProfile } from "../../../../../lib/career/careerP0Product.mjs";
import { sanitizeCapabilityDerivationTrace, sanitizeCapabilityReconciliationTrace } from "../../../../../lib/career/capabilityTrace.mjs";

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
    const [profile, comparison] = await Promise.all([
      getCapabilityProfile(context, { includeTrace: true }),
      getCapabilityDerivationComparison(context),
    ]);
    return response({ ok: true, comparison, derivation: sanitizeCapabilityDerivationTrace(profile.derivationTrace as unknown), trace: sanitizeCapabilityReconciliationTrace(profile.reconciliationTrace) });
  } catch (error) {
    return response({ ok: false, error: "CAPABILITY_RECONCILIATION_TRACE_FAILED", trace: traceFrom(error) }, 400);
  }
}
