const COMPATIBILITY_CLASSES = ["EXACT_OR_NEAR_TITLE", "COMPATIBLE_ADJACENT", "ROLE_FAMILY_ONLY", "INCOMPATIBLE"];

/** @typedef {{ sourceId?: unknown, provider?: unknown, authorityResult?: unknown, enabled?: unknown, productionNetworkAllowed?: unknown, dispatchAttempted?: unknown, dispatchCompleted?: unknown, providerOutcome?: unknown, providerRecordCount?: unknown, normalizedRecordCount?: unknown, errorClass?: unknown }} SourceTelemetryInput */
/** @typedef {{ roleCompatibility?: { classification?: unknown } }} DiscoveryResult */

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
    errorClass: source.errorClass ? String(source.errorClass).slice(0, 100) : null,
  };
}

/** @param {{ requestId?: unknown, providerMode?: unknown, normalizedRoleFamily?: unknown, sourceIds?: unknown[], sourceTelemetry?: SourceTelemetryInput[], providerRecordCount?: unknown, normalizedRecordCount?: unknown, rankedResults?: DiscoveryResult[], finalRankedResults?: DiscoveryResult[], diagnostics?: { p0RoleGateSurvivors?: unknown }, outcome?: unknown, errorClass?: unknown }} options */
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
    errorClass: errorClass ? String(errorClass).slice(0, 100) : null,
  };
}
