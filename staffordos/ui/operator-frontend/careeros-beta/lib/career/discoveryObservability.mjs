const COMPATIBILITY_CLASSES = ["EXACT_OR_NEAR_TITLE", "COMPATIBLE_ADJACENT", "ROLE_FAMILY_ONLY", "INCOMPATIBLE"];
const SAFE_ERROR_CLASSES = new Set([
  "SOURCE_DISABLED",
  "SOURCE_UNVERIFIED",
  "SOURCE_PERMISSION_INCOMPLETE",
  "SOURCE_WRITTEN_APPROVAL_REQUIRED",
  "PRODUCTION_NETWORK_NOT_ALLOWED",
  "SOURCE_NOT_FOUND",
  "SOURCE_PROVIDER_UNKNOWN",
  "SOURCE_INTERFACE_MISMATCH",
  "SOURCE_SITE_IDENTIFIER_INVALID",
  "SOURCE_BOARD_IDENTIFIER_INVALID",
  "SOURCE_ID_REQUIRED",
  "DISCOVERY_PROVIDER_NOT_AVAILABLE",
  "LEVER_SOURCE_NOT_AUTHORIZED",
  "LEVER_SOURCE_PROVIDER_MISMATCH",
  "LEVER_SITE_IDENTIFIER_INVALID",
  "LEVER_FETCH_UNAVAILABLE",
  "LEVER_RATE_LIMITED",
  "LEVER_TIMEOUT",
  "LEVER_PROVIDER_FAILURE",
  "LEVER_MALFORMED_RESPONSE",
  "LEVER_RESPONSE_TOO_LARGE",
  "LEVER_REDIRECT_NOT_ALLOWED",
  "GREENHOUSE_SOURCE_NOT_AUTHORIZED",
  "GREENHOUSE_SOURCE_PROVIDER_MISMATCH",
  "GREENHOUSE_BOARD_IDENTIFIER_INVALID",
  "GREENHOUSE_FETCH_UNAVAILABLE",
  "GREENHOUSE_RATE_LIMITED",
  "GREENHOUSE_TIMEOUT",
  "GREENHOUSE_UNAVAILABLE",
  "GREENHOUSE_MALFORMED_RESPONSE",
  "USAJOBS_WRITTEN_APPROVAL_REQUIRED",
  "USAJOBS_AUTHORITY_NOT_PROVEN",
  "USAJOBS_ADAPTER_NOT_CONFIGURED",
  "USAJOBS_PROVIDER_NOT_CONFIGURED",
  "USAJOBS_AUTH_FAILED",
  "USAJOBS_RATE_LIMITED",
  "USAJOBS_TIMEOUT",
  "USAJOBS_UNAVAILABLE",
  "USAJOBS_MALFORMED_RESPONSE",
  "INTERNAL_DISCOVERY_ERROR",
]);
const PROVIDER_FAILURE_CATEGORIES = new Set([
  "HTTP_STATUS_FAILURE",
  "REDIRECT_REJECTED",
  "TIMEOUT",
  "RESPONSE_TOO_LARGE",
  "INVALID_JSON",
  "UNEXPECTED_RESPONSE_SHAPE",
  "NETWORK_DNS_FAILURE",
  "NETWORK_CONNECTION_FAILURE",
  "TLS_FAILURE",
  "OTHER_NETWORK_FAILURE",
  "UNKNOWN_PROVIDER_FAILURE",
]);

/** @typedef {{ sourceId?: unknown, provider?: unknown, authorityResult?: unknown, enabled?: unknown, productionNetworkAllowed?: unknown, dispatchAttempted?: unknown, dispatchCompleted?: unknown, providerOutcome?: unknown, providerRecordCount?: unknown, normalizedRecordCount?: unknown, errorClass?: unknown, providerFailureCategory?: unknown, providerHttpStatus?: unknown }} SourceTelemetryInput */
/** @typedef {{ roleCompatibility?: { classification?: unknown } }} DiscoveryResult */

export function classifyDiscoveryError(errorOrCode) {
  const code = typeof errorOrCode === "string" ? errorOrCode : errorOrCode?.code;
  return SAFE_ERROR_CLASSES.has(code) ? code : "INTERNAL_DISCOVERY_ERROR";
}

function safeHttpStatus(value) {
  return Number.isInteger(value) && value >= 100 && value <= 599 ? value : null;
}

export function classifyProviderFailureCategory(errorOrCategory, status = null) {
  const requested = typeof errorOrCategory === "string" ? errorOrCategory : errorOrCategory?.providerFailureCategory;
  if (PROVIDER_FAILURE_CATEGORIES.has(requested)) return requested;
  const code = typeof errorOrCategory === "string" ? errorOrCategory : errorOrCategory?.code;
  const providerStatus = safeHttpStatus(status ?? errorOrCategory?.providerHttpStatus ?? errorOrCategory?.providerStatus);
  if (code === "LEVER_REDIRECT_NOT_ALLOWED") return "REDIRECT_REJECTED";
  if (code === "LEVER_TIMEOUT") return "TIMEOUT";
  if (code === "LEVER_RESPONSE_TOO_LARGE") return "RESPONSE_TOO_LARGE";
  if (code === "LEVER_MALFORMED_RESPONSE") return "UNKNOWN_PROVIDER_FAILURE";
  if (code === "LEVER_RATE_LIMITED" || code === "LEVER_PROVIDER_FAILURE") return providerStatus === null ? "UNKNOWN_PROVIDER_FAILURE" : "HTTP_STATUS_FAILURE";
  return "UNKNOWN_PROVIDER_FAILURE";
}

function safeCount(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

/** @param {SourceTelemetryInput} source */
function safeSource(source = {}) {
  return {
    sourceId: String(source.sourceId || "").slice(0, 160),
    provider: String(source.provider || "").slice(0, 40),
    authorityResult: String(source.authorityResult || "NOT_OBSERVABLE").slice(0, 80),
    enabled: source.enabled === true,
    productionNetworkAllowed: source.productionNetworkAllowed === true,
    dispatchAttempted: source.dispatchAttempted === true,
    dispatchCompleted: source.dispatchCompleted === true,
    providerOutcome: String(source.providerOutcome || "NOT_OBSERVABLE").slice(0, 80),
    providerRecordCount: safeCount(source.providerRecordCount),
    normalizedRecordCount: safeCount(source.normalizedRecordCount),
    errorClass: source.errorClass ? classifyDiscoveryError(source.errorClass) : null,
    providerFailureCategory: source.providerFailureCategory ? classifyProviderFailureCategory(source.providerFailureCategory) : null,
    providerHttpStatus: safeHttpStatus(source.providerHttpStatus),
  };
}

/** @param {{ requestId?: unknown, providerMode?: unknown, normalizedRoleFamily?: unknown, sourceIds?: unknown[], sourceTelemetry?: SourceTelemetryInput[], providerRecordCount?: unknown, normalizedRecordCount?: unknown, rankedResults?: DiscoveryResult[], finalRankedResults?: DiscoveryResult[], diagnostics?: { p0RoleGateSurvivors?: unknown }, outcome?: unknown, searchOutcome?: unknown, successfulSourceCount?: unknown, failedSourceCount?: unknown, errorClass?: unknown }} options */
export function buildDiscoveryObservability({
  requestId,
  providerMode = "SOURCE_REGISTRY",
  normalizedRoleFamily = null,
  sourceIds = [],
  sourceTelemetry = [],
  providerRecordCount = 0,
  normalizedRecordCount = 0,
  rankedResults = [],
  finalRankedResults = [],
  diagnostics = {},
  outcome = "SUCCESS",
  searchOutcome = null,
  successfulSourceCount = null,
  failedSourceCount = null,
  errorClass = null,
} = {}) {
  const compatibilityCounts = Object.fromEntries(COMPATIBILITY_CLASSES.map((classification) => [classification, 0]));
  for (const result of rankedResults) {
    const classification = result?.roleCompatibility?.classification;
    if (Object.hasOwn(compatibilityCounts, classification)) compatibilityCounts[classification] += 1;
  }
  const normalizedCount = safeCount(normalizedRecordCount || providerRecordCount);
  const sourceList = [...new Set(sourceIds.map((sourceId) => String(sourceId || "").trim()).filter(Boolean))].slice(0, 25);
  return {
    requestId: String(requestId || "").slice(0, 80),
    providerMode: String(providerMode || "").slice(0, 40),
    normalizedRoleFamily: normalizedRoleFamily ? String(normalizedRoleFamily).slice(0, 100) : null,
    sourceIds: sourceList,
    sourceCount: sourceList.length,
    sources: sourceTelemetry.map(safeSource),
    totalProviderRecordCount: safeCount(providerRecordCount),
    normalizedRecordCount: normalizedCount,
    preDedupeRecordCount: normalizedCount,
    postDedupeRecordCount: rankedResults.length,
    duplicateCount: Math.max(0, normalizedCount - rankedResults.length),
    compatibilityCounts,
    p0RoleGateSurvivorCount: safeCount(diagnostics.p0RoleGateSurvivors ?? finalRankedResults.length),
    finalRankedCount: finalRankedResults.length,
    providerParticipation: Object.fromEntries(sourceTelemetry.map((source) => [source.sourceId, true])),
    syntheticFallback: false,
    fallbackProviders: [],
    outcome: String(outcome || "UNKNOWN").slice(0, 80),
    searchOutcome: String(searchOutcome || outcome || "UNKNOWN").slice(0, 40),
    successfulSourceCount: successfulSourceCount === null ? null : safeCount(successfulSourceCount),
    failedSourceCount: failedSourceCount === null ? null : safeCount(failedSourceCount),
    errorClass: errorClass ? classifyDiscoveryError(errorClass) : null,
  };
}
