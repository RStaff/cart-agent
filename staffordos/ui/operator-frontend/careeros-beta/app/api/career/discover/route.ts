import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";
import { searchUsajobs } from "../../../../lib/career/usajobsDiscovery.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  if (!await currentCareerContext()) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await request.json();
    const result = await searchUsajobs(body || {});
    return NextResponse.json({ ok: true, provider: result.provider, retrievedAt: result.retrievedAt, results: result.results, criteria: result.criteria });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code || error.message : "USAJOBS_SEARCH_FAILED";
    const status = code === "USAJOBS_PROVIDER_NOT_CONFIGURED" ? 503 : code === "USAJOBS_AUTH_FAILED" ? 502 : code === "USAJOBS_RATE_LIMITED" ? 429 : code === "USAJOBS_TIMEOUT" ? 504 : 502;
    const safeCode = ["USAJOBS_PROVIDER_NOT_CONFIGURED", "USAJOBS_AUTH_FAILED", "USAJOBS_RATE_LIMITED", "USAJOBS_TIMEOUT", "USAJOBS_UNAVAILABLE", "USAJOBS_MALFORMED_RESPONSE"].includes(code) ? code : "USAJOBS_SEARCH_FAILED";
    return NextResponse.json({ ok: false, error: safeCode }, { status });
  }
}
