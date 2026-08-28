import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";
import { searchUsajobs } from "../../../../lib/career/usajobsDiscovery.mjs";
import { getExistingDiscoveryStatuses, getSearchPreferences, saveSearchPreferences } from "../../../../lib/career/careerP0Product.mjs";
import { getDiscoveryAuthorityModel } from "../../../../lib/career/discoveryAuthorityRead.mjs";
import { buildPersonalizedSearchIntent, buildProviderCriteriaForIntent, publicSearchIntent } from "../../../../lib/career/discoverySearchIntent.mjs";
import { rankDiscoveryResults } from "../../../../lib/career/discoveryRanking.mjs";
import { classifyDiscoveryProviders } from "../../../../lib/career/discoveryProviderAuthorization.mjs";

export const runtime = "nodejs";

const searchAuthorizedProvider = searchUsajobs as (input: Record<string, unknown>) => Promise<Record<string, any>>;
const rankProviderResults = rankDiscoveryResults as (input: Record<string, unknown>) => { results: any[] };

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, preferences: await getSearchPreferences(context) });
}

export async function PUT(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try { return NextResponse.json({ ok: true, preferences: await saveSearchPreferences(context, await request.json()) }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "SEARCH_PREFERENCES_FAILED" }, { status: 400 }); }
}

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await request.json();
    const authorityModel = await getDiscoveryAuthorityModel(context);
    const searchIntent = buildPersonalizedSearchIntent({ preferences: body || {}, ...authorityModel });
    const providerCriteria = buildProviderCriteriaForIntent(searchIntent);
    const result = await searchAuthorizedProvider(providerCriteria);
    const existingStatuses = await getExistingDiscoveryStatuses(context, result.results);
    const ranked = rankProviderResults({ intent: searchIntent, capabilities: searchIntent.authority.capabilities, results: result.results, existingStatuses });
    const providerGate = classifyDiscoveryProviders();
    return NextResponse.json({ ok: true, provider: result.provider, providers: [result.provider], retrievedAt: result.retrievedAt, results: ranked.results, existingStatuses, criteria: result.criteria, providerCriteria, searchIntent: publicSearchIntent(searchIntent), providerGate: { newProviderActivation: providerGate.newProviderActivation, authorizedForBeta: providerGate.authorizedForBeta, blockedByAuthorization: providerGate.blockedByAuthorization } });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code || error.message : "USAJOBS_SEARCH_FAILED";
    const status = code === "USAJOBS_PROVIDER_NOT_CONFIGURED" ? 503 : code === "USAJOBS_AUTH_FAILED" ? 502 : code === "USAJOBS_RATE_LIMITED" ? 429 : code === "USAJOBS_TIMEOUT" ? 504 : 502;
    const safeCode = ["USAJOBS_PROVIDER_NOT_CONFIGURED", "USAJOBS_AUTH_FAILED", "USAJOBS_RATE_LIMITED", "USAJOBS_TIMEOUT", "USAJOBS_UNAVAILABLE", "USAJOBS_MALFORMED_RESPONSE"].includes(code) ? code : "USAJOBS_SEARCH_FAILED";
    return NextResponse.json({ ok: false, error: safeCode }, { status });
  }
}
