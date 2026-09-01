export const SOURCE_AUTHORITY_REGISTRY_VERSION = "CAREEROS_SOURCE_AUTHORITY_REGISTRY_V1";
export const SOURCE_AUTHORITY_STATES = Object.freeze(["AUTHORIZED", "DISABLED", "UNVERIFIED", "WRITTEN_APPROVAL_REQUIRED"]);
export const SOURCE_INTERFACE_TYPES = Object.freeze(["GREENHOUSE_JOB_BOARD_API", "LEVER_POSTINGS_API"]);
export const RATE_LIMIT_POLICY_CONSERVATIVE_UNKNOWN = "CONSERVATIVE_UNKNOWN";

const SUPPORTED_AUTOMATIC_PROVIDERS = new Set(["GREENHOUSE", "LEVER"]);
const REQUIRED_AUTOMATIC_USE_FLAGS = ["commercialMultiUserAllowed", "storageAllowed", "derivedAnalysisAllowed", "displayAllowed"];

export const DEFAULT_SOURCE_AUTHORITY_REGISTRY = Object.freeze([
  Object.freeze({
    sourceId: "greenhouse-test-fixture-disabled",
    provider: "GREENHOUSE",
    employerName: "Test Fixture Employer",
    boardToken: "test-fixture",
    canonicalSourceUrl: "https://boards.greenhouse.io/test-fixture",
    interfaceType: "GREENHOUSE_JOB_BOARD_API",
    authorityStatus: "AUTHORIZED",
    authorityEvidenceRef: "TEST_ONLY_MOCKED_FIXTURE_NOT_FOR_PRODUCTION_NETWORK",
    commercialMultiUserAllowed: true,
    storageAllowed: true,
    derivedAnalysisAllowed: true,
    displayAllowed: true,
    attributionText: "Source: Greenhouse / employer career site",
    sourceLinkRequired: true,
    applyRedirectRequired: true,
    rateLimitPolicy: "TEST_ONLY_NO_LIVE_NETWORK",
    removalPolicy: "TEST_ONLY",
    enabled: false,
    testOnly: true,
    productionNetworkAllowed: false,
    lastReviewedAt: "2026-09-01",
    authorityVersion: SOURCE_AUTHORITY_REGISTRY_VERSION,
  }),
  Object.freeze({
    sourceId: "lever-test-fixture-disabled",
    provider: "LEVER",
    employerName: "Test Fixture Employer",
    siteIdentifier: "test-fixture",
    leverSite: "test-fixture",
    canonicalSourceUrl: "https://jobs.lever.co/test-fixture",
    interfaceType: "LEVER_POSTINGS_API",
    authorityStatus: "AUTHORIZED",
    authorityEvidenceRef: "TEST_ONLY_MOCKED_FIXTURE_NOT_FOR_PRODUCTION_NETWORK",
    commercialMultiUserAllowed: true,
    storageAllowed: true,
    derivedAnalysisAllowed: true,
    displayAllowed: true,
    attributionText: "Source: Lever / employer career site",
    sourceLinkRequired: true,
    applyRedirectRequired: true,
    rateLimitPolicy: "TEST_ONLY_NO_LIVE_NETWORK",
    removalPolicy: "TEST_ONLY",
    enabled: false,
    testOnly: true,
    productionNetworkAllowed: false,
    lastReviewedAt: "2026-09-01",
    authorityVersion: SOURCE_AUTHORITY_REGISTRY_VERSION,
  }),
]);

function clean(value, limit = 1000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function providerKey(value) {
  return clean(value, 120).toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function safeGreenhouseBoardToken(value) {
  const token = clean(value, 160);
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/.test(token) ? token : null;
}

export function safeLeverSiteIdentifier(value) {
  const site = clean(value, 160);
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,158}[A-Za-z0-9])?$/.test(site) ? site : null;
}

function knownAuthorityStatus(value) {
  const status = clean(value, 80).toUpperCase();
  return SOURCE_AUTHORITY_STATES.includes(status) ? status : "UNVERIFIED";
}

function defaultInterfaceTypeForProvider(provider) {
  return provider === "LEVER" ? "LEVER_POSTINGS_API" : "GREENHOUSE_JOB_BOARD_API";
}

function knownInterfaceType(value, provider) {
  const type = clean(value, 120).toUpperCase();
  return SOURCE_INTERFACE_TYPES.includes(type) ? type : defaultInterfaceTypeForProvider(provider);
}

function knownLeverRegion(value) {
  return clean(value, 20).toUpperCase() === "EU" ? "EU" : "US";
}

function expectedInterfaceTypeForSource(source) {
  return source.provider === "LEVER" ? "LEVER_POSTINGS_API" : source.provider === "GREENHOUSE" ? "GREENHOUSE_JOB_BOARD_API" : null;
}

function sourceInterfaceValid(source) {
  const expected = expectedInterfaceTypeForSource(source);
  return Boolean(expected && source.interfaceType === expected);
}

function providerIdentifierValid(source) {
  if (source.provider === "GREENHOUSE") return Boolean(safeGreenhouseBoardToken(source.boardToken));
  if (source.provider === "LEVER") return Boolean(safeLeverSiteIdentifier(source.siteIdentifier));
  return false;
}

export function normalizeSourceAuthorityEntry(input = {}) {
  const provider = providerKey(input.provider);
  const boardToken = provider === "GREENHOUSE" ? safeGreenhouseBoardToken(input.boardToken || input.boardIdentifier || input.sourceIdentifier) : null;
  const siteIdentifier = provider === "LEVER" ? safeLeverSiteIdentifier(input.siteIdentifier || input.leverSite || input.sourceIdentifier) : null;
  const sourceIdentifier = provider === "GREENHOUSE" ? boardToken : provider === "LEVER" ? siteIdentifier : clean(input.sourceIdentifier || input.boardToken || input.boardIdentifier || input.siteIdentifier, 160) || null;
  return {
    sourceId: clean(input.sourceId, 160),
    provider: provider || "UNKNOWN",
    employerName: clean(input.employerName || input.employer, 240),
    boardToken,
    siteIdentifier,
    leverSite: siteIdentifier,
    sourceIdentifier,
    leverRegion: provider === "LEVER" ? knownLeverRegion(input.leverRegion || input.region) : null,
    canonicalSourceUrl: clean(input.canonicalSourceUrl || input.sourceUrl, 1000) || null,
    interfaceType: knownInterfaceType(input.interfaceType, provider),
    authorityStatus: knownAuthorityStatus(input.authorityStatus),
    authorityEvidenceRef: clean(input.authorityEvidenceRef || input.authorityEvidence, 500) || null,
    commercialMultiUserAllowed: input.commercialMultiUserAllowed === true,
    storageAllowed: input.storageAllowed === true,
    derivedAnalysisAllowed: input.derivedAnalysisAllowed === true,
    displayAllowed: input.displayAllowed === true,
    attributionText: clean(input.attributionText, 500) || null,
    sourceLinkRequired: input.sourceLinkRequired !== false,
    applyRedirectRequired: input.applyRedirectRequired !== false,
    rateLimitPolicy: clean(input.rateLimitPolicy, 240) || RATE_LIMIT_POLICY_CONSERVATIVE_UNKNOWN,
    removalPolicy: clean(input.removalPolicy, 240) || "SOURCE_EXPIRATION_UNKNOWN",
    enabled: input.enabled === true,
    testOnly: input.testOnly === true,
    productionNetworkAllowed: input.productionNetworkAllowed === true,
    lastReviewedAt: clean(input.lastReviewedAt, 80) || null,
    authorityVersion: clean(input.authorityVersion, 120) || SOURCE_AUTHORITY_REGISTRY_VERSION,
  };
}

export function listSourceAuthorityEntries(registry = DEFAULT_SOURCE_AUTHORITY_REGISTRY) {
  return (registry || []).map(normalizeSourceAuthorityEntry).filter((entry) => entry.sourceId);
}

export function lookupSourceAuthorityEntry(sourceId, registry = DEFAULT_SOURCE_AUTHORITY_REGISTRY) {
  const wanted = clean(sourceId, 160);
  if (!wanted) return null;
  return listSourceAuthorityEntries(registry).find((entry) => entry.sourceId === wanted) || null;
}

export function publicSourceAuthoritySnapshot(entry) {
  const normalized = normalizeSourceAuthorityEntry(entry);
  const permissionComplete = REQUIRED_AUTOMATIC_USE_FLAGS.every((flag) => normalized[flag] === true);
  const providerSupported = SUPPORTED_AUTOMATIC_PROVIDERS.has(normalized.provider);
  return {
    version: SOURCE_AUTHORITY_REGISTRY_VERSION,
    sourceId: normalized.sourceId,
    provider: normalized.provider,
    employerName: normalized.employerName,
    sourceIdentifier: normalized.sourceIdentifier,
    siteIdentifier: normalized.siteIdentifier,
    leverSite: normalized.leverSite,
    leverRegion: normalized.leverRegion,
    interfaceType: normalized.interfaceType,
    authorityStatus: normalized.authorityStatus,
    enabled: normalized.enabled,
    authorizedForAutomaticRetrieval: normalized.authorityStatus === "AUTHORIZED" && normalized.enabled && permissionComplete && providerSupported && sourceInterfaceValid(normalized) && providerIdentifierValid(normalized),
    commercialMultiUserAllowed: normalized.commercialMultiUserAllowed,
    storageAllowed: normalized.storageAllowed,
    derivedAnalysisAllowed: normalized.derivedAnalysisAllowed,
    displayAllowed: normalized.displayAllowed,
    attributionText: normalized.attributionText,
    sourceLinkRequired: normalized.sourceLinkRequired,
    applyRedirectRequired: normalized.applyRedirectRequired,
    rateLimitPolicy: normalized.rateLimitPolicy,
    removalPolicy: normalized.removalPolicy,
    lastReviewedAt: normalized.lastReviewedAt,
  };
}

function blocked(code, source = null) {
  return { authorized: false, code, source, authority: source ? publicSourceAuthoritySnapshot(source) : null };
}

export function authorizeSourceForAutomaticRetrieval(sourceId, { registry = DEFAULT_SOURCE_AUTHORITY_REGISTRY } = {}) {
  if (!clean(sourceId, 160)) return blocked("SOURCE_ID_REQUIRED");
  const source = lookupSourceAuthorityEntry(sourceId, registry);
  if (!source) return blocked("SOURCE_NOT_FOUND");
  if (!SUPPORTED_AUTOMATIC_PROVIDERS.has(source.provider)) return blocked("SOURCE_PROVIDER_UNKNOWN", source);
  if (source.authorityStatus === "DISABLED" || !source.enabled) return blocked("SOURCE_DISABLED", source);
  if (source.authorityStatus === "UNVERIFIED") return blocked("SOURCE_UNVERIFIED", source);
  if (source.authorityStatus === "WRITTEN_APPROVAL_REQUIRED") return blocked("SOURCE_WRITTEN_APPROVAL_REQUIRED", source);
  if (source.authorityStatus !== "AUTHORIZED") return blocked("SOURCE_AUTHORITY_NOT_GRANTED", source);
  if (!sourceInterfaceValid(source)) return blocked("SOURCE_INTERFACE_MISMATCH", source);
  if (source.provider === "GREENHOUSE" && !safeGreenhouseBoardToken(source.boardToken)) return blocked("SOURCE_BOARD_IDENTIFIER_INVALID", source);
  if (source.provider === "LEVER" && !safeLeverSiteIdentifier(source.siteIdentifier)) return blocked("SOURCE_SITE_IDENTIFIER_INVALID", source);
  if (REQUIRED_AUTOMATIC_USE_FLAGS.some((flag) => source[flag] !== true)) return blocked("SOURCE_PERMISSION_INCOMPLETE", source);
  return {
    authorized: true,
    code: "AUTHORIZED",
    source: { ...source, retrievalAuthorized: true },
    authority: publicSourceAuthoritySnapshot(source),
  };
}

export function sourceAuthorityRegistrySummary(registry = DEFAULT_SOURCE_AUTHORITY_REGISTRY) {
  const entries = listSourceAuthorityEntries(registry);
  const enabledAuthorized = entries.filter((entry) => entry.enabled && entry.authorityStatus === "AUTHORIZED");
  return {
    version: SOURCE_AUTHORITY_REGISTRY_VERSION,
    sourceCount: entries.length,
    enabledAuthorizedSourceCount: enabledAuthorized.length,
    productionEnabledGreenhouseSourceCount: enabledAuthorized.filter((entry) => entry.provider === "GREENHOUSE" && !entry.testOnly).length,
    defaultProductionGreenhouseSourcesEnabled: enabledAuthorized.some((entry) => entry.provider === "GREENHOUSE" && !entry.testOnly),
    productionEnabledLeverSourceCount: enabledAuthorized.filter((entry) => entry.provider === "LEVER" && !entry.testOnly).length,
    defaultProductionLeverSourcesEnabled: enabledAuthorized.some((entry) => entry.provider === "LEVER" && !entry.testOnly),
  };
}

export function isDiscoveryRecordSourceAuthorized(record = {}) {
  const metadata = record.providerMetadata && typeof record.providerMetadata === "object" ? record.providerMetadata : {};
  const authority = record.sourceAuthority || metadata.sourceAuthority || {};
  if (!authority || typeof authority !== "object") return false;
  const recordProvider = providerKey(record.provider || record.sourceProvider);
  return Boolean(
    clean(authority.sourceId, 160) &&
    providerKey(authority.provider) === recordProvider &&
    authority.authorityStatus === "AUTHORIZED" &&
    authority.enabled === true &&
    authority.authorizedForAutomaticRetrieval === true &&
    REQUIRED_AUTOMATIC_USE_FLAGS.every((flag) => authority[flag] === true),
  );
}
