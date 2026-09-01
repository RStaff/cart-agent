import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";
import { searchUsajobs } from "../../../../lib/career/usajobsDiscovery.mjs";
import { searchAuthorizedUsajobsDiscovery } from "../../../../lib/career/usajobsAuthority.mjs";
import { searchAuthorizedDiscoverySources } from "../../../../lib/career/discoveryProviderDispatcher.mjs";
import { getExistingDiscoveryStatuses, getRelevanceFeedback, getSearchPreferences, saveRelevanceFeedback, saveSearchPreferences } from "../../../../lib/career/careerP0Product.mjs";
import { getDiscoveryAuthorityModel } from "../../../../lib/career/discoveryAuthorityRead.mjs";
import { buildPersonalizedSearchIntent, buildProviderCriteriaForIntent, publicSearchIntent } from "../../../../lib/career/discoverySearchIntent.mjs";
import { buildDiscoveryDiagnostics, rankDiscoveryResults } from "../../../../lib/career/discoveryRanking.mjs";
import { classifyDiscoveryProviders } from "../../../../lib/career/discoveryProviderAuthorization.mjs";

export const runtime = "nodejs";

const searchAuthorizedProvider = searchUsajobs as (input: Record<string, unknown>) => Promise<Record<string, any>>;
const searchAuthorizedUsajobs = searchAuthorizedUsajobsDiscovery as unknown as (input: { criteria: Record<string, unknown>; adapter: (input: Record<string, unknown>) => Promise<Record<string, any>> }) => Promise<Record<string, any>>;
const searchAuthorizedSources = searchAuthorizedDiscoverySources as unknown as (input: { sourceIds: string[]; criteria: Record<string, unknown> }) => Promise<Record<string, any>>;
const rankProviderResults = rankDiscoveryResults as (input: Record<string, unknown>) => { results: any[] };

function providerKey(value: unknown) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function requestedSourceIds(body: Record<string, unknown>): string[] {
  const values: unknown[] = Array.isArray(body.sourceIds) ? body.sourceIds : body.sourceId ? [body.sourceId] : [];
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function routeError(code: string) {
  return Object.assign(new Error(code), { code });
}

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
    const sourceIds = requestedSourceIds(body || {});
    const requestedProvider = providerKey(body?.provider);
    if (requestedProvider && !["USAJOBS", "GREENHOUSE", "LEVER", "SOURCE_REGISTRY"].includes(requestedProvider)) throw routeError("DISCOVERY_PROVIDER_NOT_AVAILABLE");
    if ((requestedProvider === "GREENHOUSE" || requestedProvider === "LEVER" || requestedProvider === "SOURCE_REGISTRY") && sourceIds.length === 0) throw routeError("SOURCE_ID_REQUIRED");
    const useSourceRegistry = sourceIds.length > 0 && requestedProvider !== "USAJOBS";
    const result = useSourceRegistry ? await searchAuthorizedSources({ sourceIds, criteria: providerCriteria }) : await searchAuthorizedUsajobs({ criteria: providerCriteria, adapter: searchAuthorizedProvider });
    const existingStatuses = await getExistingDiscoveryStatuses(context, result.results);
    const feedback = await getRelevanceFeedback(context, searchIntent.roleIntent.normalizedTitle);
    const rejectedTitles = new Set((feedback as Array<{ observedTitleNormalized: string }>).map((item) => item.observedTitleNormalized));
    const ranked = rankProviderResults({ intent: searchIntent, capabilities: searchIntent.authority.capabilities, results: result.results.filter((item: any) => !rejectedTitles.has(String(item.title || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim())), existingStatuses });
    const diagnostics = buildDiscoveryDiagnostics({ providerCount: result.results.length, rankedResults: ranked.results, explicitTarget: searchIntent.roleIntent.requestedTitle });
    if (searchIntent.roleIntent.requestedTitle) ranked.results = ranked.results.filter((item: any) => item.roleCompatibility.classification !== "INCOMPATIBLE" && item.roleCompatibility.classification !== "ROLE_FAMILY_ONLY");
    diagnostics.p0RoleGateSurvivors = ranked.results.length;
    diagnostics.finalRankedResults = ranked.results.length;
    const providerGate = classifyDiscoveryProviders();
    return NextResponse.json({ ok: true, provider: result.provider, providers: result.providers || [result.provider], sourceIds: result.sourceIds || [], retrievedAt: result.retrievedAt, results: ranked.results, diagnostics, existingStatuses, criteria: result.criteria, providerCriteria, searchIntent: publicSearchIntent(searchIntent), providerGate: { newProviderActivation: providerGate.newProviderActivation, authorizedForBeta: providerGate.authorizedForBeta, blockedByAuthorization: providerGate.blockedByAuthorization } });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code || error.message : "USAJOBS_SEARCH_FAILED";
    const sourceAuthorityCodes = ["USAJOBS_WRITTEN_APPROVAL_REQUIRED", "USAJOBS_AUTHORITY_NOT_PROVEN", "USAJOBS_ADAPTER_NOT_CONFIGURED", "SOURCE_ID_REQUIRED", "SOURCE_NOT_FOUND", "SOURCE_DISABLED", "SOURCE_UNVERIFIED", "SOURCE_WRITTEN_APPROVAL_REQUIRED", "SOURCE_PERMISSION_INCOMPLETE", "SOURCE_PROVIDER_UNKNOWN", "SOURCE_INTERFACE_MISMATCH", "SOURCE_BOARD_IDENTIFIER_INVALID", "SOURCE_SITE_IDENTIFIER_INVALID", "DISCOVERY_PROVIDER_NOT_AVAILABLE", "GREENHOUSE_SOURCE_NOT_AUTHORIZED", "GREENHOUSE_SOURCE_PROVIDER_MISMATCH", "GREENHOUSE_BOARD_IDENTIFIER_INVALID", "GREENHOUSE_FETCH_UNAVAILABLE", "GREENHOUSE_RATE_LIMITED", "GREENHOUSE_TIMEOUT", "GREENHOUSE_UNAVAILABLE", "GREENHOUSE_MALFORMED_RESPONSE", "LEVER_SOURCE_NOT_AUTHORIZED", "LEVER_SOURCE_PROVIDER_MISMATCH", "LEVER_SITE_IDENTIFIER_INVALID", "LEVER_FETCH_UNAVAILABLE", "LEVER_RATE_LIMITED", "LEVER_TIMEOUT", "LEVER_PROVIDER_FAILURE", "LEVER_MALFORMED_RESPONSE", "LEVER_RESPONSE_TOO_LARGE", "LEVER_REDIRECT_NOT_ALLOWED"];
    const status = code === "USAJOBS_PROVIDER_NOT_CONFIGURED" || code === "DISCOVERY_PROVIDER_NOT_AVAILABLE" || code === "GREENHOUSE_FETCH_UNAVAILABLE" || code === "LEVER_FETCH_UNAVAILABLE" ? 503 : code === "USAJOBS_AUTH_FAILED" || code === "GREENHOUSE_UNAVAILABLE" || code === "GREENHOUSE_MALFORMED_RESPONSE" || code === "LEVER_PROVIDER_FAILURE" || code === "LEVER_MALFORMED_RESPONSE" || code === "LEVER_RESPONSE_TOO_LARGE" || code === "LEVER_REDIRECT_NOT_ALLOWED" ? 502 : code === "USAJOBS_RATE_LIMITED" || code === "GREENHOUSE_RATE_LIMITED" || code === "LEVER_RATE_LIMITED" ? 429 : code === "USAJOBS_TIMEOUT" || code === "GREENHOUSE_TIMEOUT" || code === "LEVER_TIMEOUT" ? 504 : sourceAuthorityCodes.includes(code) ? 403 : 502;
    const safeCode = ["USAJOBS_PROVIDER_NOT_CONFIGURED", "USAJOBS_AUTH_FAILED", "USAJOBS_RATE_LIMITED", "USAJOBS_TIMEOUT", "USAJOBS_UNAVAILABLE", "USAJOBS_MALFORMED_RESPONSE", ...sourceAuthorityCodes].includes(code) ? code : "USAJOBS_SEARCH_FAILED";
    return NextResponse.json({ ok: false, error: safeCode }, { status });
  }
}

export async function PATCH(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try { return NextResponse.json({ ok: true, feedback: await saveRelevanceFeedback(context, await request.json()) }, { status: 201 }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "RELEVANCE_FEEDBACK_FAILED" }, { status: 400 }); }
}
