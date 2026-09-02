import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  authorizeSourceForAutomaticRetrieval,
  isDiscoveryRecordSourceAuthorized,
  listAvailableAutomaticDiscoverySources,
  listSourceAuthorityEntries,
  normalizeSourceAuthorityEntry,
  publicSourceAuthoritySnapshot,
  safeGreenhouseBoardToken,
  safeLeverSiteIdentifier,
  sourceAuthorityRegistrySummary,
} from "./sourceAuthorityRegistry.mjs";

const registrySource = readFileSync(new URL("./sourceAuthorityRegistry.mjs", import.meta.url), "utf8");

function source(overrides = {}) {
  return {
    sourceId: "source-greenhouse-approved",
    provider: "GREENHOUSE",
    employerName: "Approved Fixture Employer",
    boardToken: "approved-fixture",
    interfaceType: "GREENHOUSE_JOB_BOARD_API",
    authorityStatus: "AUTHORIZED",
    authorityEvidenceRef: "TEST_ONLY_WRITTEN_APPROVAL_FIXTURE",
    commercialMultiUserAllowed: true,
    storageAllowed: true,
    derivedAnalysisAllowed: true,
    displayAllowed: true,
    attributionText: "Source: Greenhouse / Approved Fixture Employer career site",
    sourceLinkRequired: true,
    applyRedirectRequired: true,
    rateLimitPolicy: "CONSERVATIVE_UNKNOWN",
    removalPolicy: "SOURCE_REMOVAL_REQUIRES_REVIEW",
    enabled: true,
    productionNetworkAllowed: true,
    lastReviewedAt: "2026-09-01",
    ...overrides,
  };
}

function leverSource(overrides = {}) {
  return {
    sourceId: "source-lever-approved",
    provider: "LEVER",
    employerName: "Approved Fixture Employer",
    siteIdentifier: "approved-fixture",
    leverSite: "approved-fixture",
    interfaceType: "LEVER_POSTINGS_API",
    authorityStatus: "AUTHORIZED",
    authorityEvidenceRef: "TEST_ONLY_LEVER_PUBLIC_POSTINGS_FIXTURE",
    commercialMultiUserAllowed: true,
    storageAllowed: true,
    derivedAnalysisAllowed: true,
    displayAllowed: true,
    attributionText: "Source: Lever / Approved Fixture Employer career site",
    sourceLinkRequired: true,
    applyRedirectRequired: true,
    rateLimitPolicy: "CONSERVATIVE_UNKNOWN",
    removalPolicy: "SOURCE_REMOVAL_REQUIRES_REVIEW",
    enabled: true,
    productionNetworkAllowed: true,
    lastReviewedAt: "2026-09-01",
    ...overrides,
  };
}

test("authorized enabled Greenhouse source permits retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-greenhouse-approved", { registry: [source()] });
  assert.equal(authorization.authorized, true);
  assert.equal(authorization.source.retrievalAuthorized, true);
  assert.equal(authorization.source.provider, "GREENHOUSE");
});

test("authorized enabled Lever source permits retrieval with provider-specific site identity", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-lever-approved", { registry: [leverSource()] });
  assert.equal(authorization.authorized, true);
  assert.equal(authorization.source.retrievalAuthorized, true);
  assert.equal(authorization.source.provider, "LEVER");
  assert.equal(authorization.source.siteIdentifier, "approved-fixture");
  assert.equal(authorization.source.leverSite, "approved-fixture");
  assert.equal(authorization.source.boardToken, null);
});

test("disabled source blocks retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-greenhouse-approved", { registry: [source({ enabled: false })] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_DISABLED");
});

test("enabled source without production network permission blocks retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-lever-approved", { registry: [leverSource({ productionNetworkAllowed: false })] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "PRODUCTION_NETWORK_NOT_ALLOWED");
  assert.equal(authorization.authority.productionNetworkAllowed, false);
  assert.equal(authorization.authority.authorizedForAutomaticRetrieval, false);
});

test("unverified source blocks retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-greenhouse-approved", { registry: [source({ authorityStatus: "UNVERIFIED" })] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_UNVERIFIED");
});

test("written-approval-required source blocks retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-greenhouse-approved", { registry: [source({ authorityStatus: "WRITTEN_APPROVAL_REQUIRED" })] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_WRITTEN_APPROVAL_REQUIRED");
});

test("unknown source blocks retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("missing-source", { registry: [source()] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_NOT_FOUND");
});

test("unknown provider blocks retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-unknown", { registry: [source({ sourceId: "source-unknown", provider: "unknown" })] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_PROVIDER_UNKNOWN");
});

test("Lever source without complete automatic-use authority blocks retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-lever-approved", { registry: [leverSource({ derivedAnalysisAllowed: false })] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_PERMISSION_INCOMPLETE");
});

test("missing storage, display, or derived-analysis authority blocks retrieval", () => {
  for (const flag of ["commercialMultiUserAllowed", "storageAllowed", "derivedAnalysisAllowed", "displayAllowed"]) {
    const authorization = authorizeSourceForAutomaticRetrieval("source-greenhouse-approved", { registry: [source({ [flag]: false })] });
    assert.equal(authorization.authorized, false, flag);
    assert.equal(authorization.code, "SOURCE_PERMISSION_INCOMPLETE");
    assert.equal(authorization.authority.authorizedForAutomaticRetrieval, false, flag);
  }
});

test("Greenhouse board identifier cannot be converted into arbitrary URL retrieval", () => {
  assert.equal(safeGreenhouseBoardToken("approved-fixture"), "approved-fixture");
  assert.equal(safeGreenhouseBoardToken("https://example.com/jobs"), null);
  assert.equal(safeGreenhouseBoardToken("example.com/jobs"), null);
  assert.equal(normalizeSourceAuthorityEntry(source({ boardToken: "https://example.com/jobs" })).boardToken, null);
});

test("Lever site identifier cannot be converted into arbitrary URL retrieval", () => {
  assert.equal(safeLeverSiteIdentifier("approved-fixture"), "approved-fixture");
  assert.equal(safeLeverSiteIdentifier("https://jobs.lever.co/approved-fixture"), null);
  assert.equal(safeLeverSiteIdentifier("jobs.lever.co/approved-fixture"), null);
  assert.equal(safeLeverSiteIdentifier("../approved-fixture"), null);
  assert.equal(safeLeverSiteIdentifier("approved-fixture?mode=json"), null);
  assert.equal(normalizeSourceAuthorityEntry(leverSource({ siteIdentifier: "https://jobs.lever.co/approved-fixture" })).siteIdentifier, null);
});

test("Lever site identity comes from registry fields, not Greenhouse boardToken semantics", () => {
  const normalized = normalizeSourceAuthorityEntry(leverSource({ siteIdentifier: null, leverSite: null, sourceIdentifier: null, boardToken: "approved-fixture" }));
  assert.equal(normalized.provider, "LEVER");
  assert.equal(normalized.boardToken, null);
  assert.equal(normalized.siteIdentifier, null);
  assert.equal(normalized.sourceIdentifier, null);
});

test("invalid Lever site identity blocks an otherwise authorized enabled source", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-lever-approved", { registry: [leverSource({ siteIdentifier: "https://jobs.lever.co/approved-fixture", leverSite: null })] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_SITE_IDENTIFIER_INVALID");
});

test("Lever source with Greenhouse interface type blocks before retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-lever-approved", { registry: [leverSource({ interfaceType: "GREENHOUSE_JOB_BOARD_API" })] });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_INTERFACE_MISMATCH");
});

test("default registry has no enabled production Greenhouse source", () => {
  const summary = sourceAuthorityRegistrySummary();
  assert.equal(summary.defaultProductionGreenhouseSourcesEnabled, false);
  assert.equal(summary.productionEnabledGreenhouseSourceCount, 0);
});

test("Frontify remains registered as an EU Lever source but is fail closed", () => {
  const frontify = listSourceAuthorityEntries().find((entry) => entry.sourceId === "lever-frontify");
  assert.ok(frontify);
  assert.equal(frontify.provider, "LEVER");
  assert.equal(frontify.interfaceType, "LEVER_POSTINGS_API");
  assert.equal(frontify.employerName, "Frontify");
  assert.equal(frontify.siteIdentifier, "frontify");
  assert.equal(frontify.leverSite, "frontify");
  assert.equal(frontify.leverRegion, "EU");
  assert.equal(frontify.canonicalSourceUrl, "https://jobs.lever.co/frontify");
  assert.equal(frontify.authorityStatus, "AUTHORIZED");
  assert.equal(frontify.enabled, false);
  assert.equal(frontify.productionNetworkAllowed, false);
  assert.equal(frontify.testOnly, false);
  const authorization = authorizeSourceForAutomaticRetrieval("lever-frontify");
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_DISABLED");
  assert.equal(publicSourceAuthoritySnapshot(frontify).authorizedForAutomaticRetrieval, false);
});

test("Frontify disable preserves the active production source set", () => {
  const available = listAvailableAutomaticDiscoverySources();
  assert.deepEqual(available.map((entry) => entry.sourceId), ["lever-freedompay", "lever-dnb"]);
  const summary = sourceAuthorityRegistrySummary();
  assert.equal(summary.productionEnabledLeverSourceCount, 2);
  assert.equal(summary.productionNetworkAllowedLeverSourceCount, 2);
});

test("default registry has exactly two enabled production Lever sources", () => {
  const summary = sourceAuthorityRegistrySummary();
  assert.equal(summary.defaultProductionLeverSourcesEnabled, true);
  assert.equal(summary.productionEnabledLeverSourceCount, 2);
  assert.equal(summary.productionNetworkAllowedLeverSourceCount, 2);
});

test("default registry activates the reviewed FreedomPay Lever source", () => {
  const entries = listSourceAuthorityEntries();
  const freedomPay = entries.find((entry) => entry.sourceId === "lever-freedompay");
  assert.ok(freedomPay);
  assert.equal(freedomPay.provider, "LEVER");
  assert.equal(freedomPay.interfaceType, "LEVER_POSTINGS_API");
  assert.equal(freedomPay.employerName, "FreedomPay");
  assert.equal(freedomPay.siteIdentifier, "freedompay");
  assert.equal(freedomPay.leverSite, "freedompay");
  assert.equal(freedomPay.sourceIdentifier, "freedompay");
  assert.equal(freedomPay.boardToken, null);
  assert.equal(freedomPay.canonicalSourceUrl, "https://jobs.lever.co/freedompay");
  assert.equal(freedomPay.authorityStatus, "AUTHORIZED");
  assert.equal(freedomPay.authorityEvidenceRef, "LEVER_PUBLIC_POSTINGS_THIRD_PARTY_SCRAPING_DOC_AND_FREEDOMPAY_OFFICIAL_CAREERS_LINK_2026-09-02");
  assert.equal(freedomPay.commercialMultiUserAllowed, true);
  assert.equal(freedomPay.storageAllowed, true);
  assert.equal(freedomPay.derivedAnalysisAllowed, true);
  assert.equal(freedomPay.displayAllowed, true);
  assert.equal(freedomPay.sourceLinkRequired, true);
  assert.equal(freedomPay.applyRedirectRequired, true);
  assert.equal(freedomPay.rateLimitPolicy, "CONSERVATIVE_UNKNOWN");
  assert.equal(freedomPay.removalPolicy, "REVALIDATE_STOP_PRESENTING_MISSING_OR_CLOSED_NO_RAW_FEED_ARCHIVE");
  assert.equal(freedomPay.testOnly, false);
  assert.equal(freedomPay.enabled, true);
  assert.equal(freedomPay.productionNetworkAllowed, true);
  assert.equal(freedomPay.lastReviewedAt, "2026-09-02");
});

test("activated FreedomPay source permits automatic retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("lever-freedompay");
  assert.equal(authorization.authorized, true);
  assert.equal(authorization.code, "AUTHORIZED");
  assert.equal(authorization.source.sourceId, "lever-freedompay");
  assert.equal(authorization.source.provider, "LEVER");
  assert.equal(authorization.source.siteIdentifier, "freedompay");
  assert.equal(authorization.source.enabled, true);
  assert.equal(authorization.source.productionNetworkAllowed, true);
  assert.equal(authorization.authority.authorizedForAutomaticRetrieval, true);
});

test("FreedomPay rollback state returns SOURCE_DISABLED", () => {
  const entries = listSourceAuthorityEntries();
  const rollback = entries.map((entry) => entry.sourceId === "lever-freedompay" ? { ...entry, enabled: false, productionNetworkAllowed: false } : entry);
  const authorization = authorizeSourceForAutomaticRetrieval("lever-freedompay", { registry: rollback });
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "SOURCE_DISABLED");
  assert.equal(authorization.source.enabled, false);
  assert.equal(authorization.source.productionNetworkAllowed, false);
});

test("default registry has three real Lever sources and two enabled production network sources", () => {
  const entries = listSourceAuthorityEntries();
  const realLeverSources = entries.filter((entry) => entry.provider === "LEVER" && !entry.testOnly);
  assert.deepEqual(realLeverSources.map((entry) => entry.sourceId), ["lever-freedompay", "lever-dnb", "lever-frontify"]);
  assert.equal(realLeverSources.filter((entry) => entry.enabled).length, 2);
  assert.equal(realLeverSources.filter((entry) => entry.productionNetworkAllowed).length, 2);
  assert.equal(sourceAuthorityRegistrySummary().productionEnabledLeverSourceCount, 2);
});

test("available automatic discovery sources expose only active governed production sources", () => {
  const sources = listAvailableAutomaticDiscoverySources();
  assert.deepEqual(sources.map((entry) => entry.sourceId), ["lever-freedompay", "lever-dnb"]);
  assert.equal(sources[0].provider, "LEVER");
  assert.equal(sources[0].employerName, "FreedomPay");
  assert.equal(sources[0].siteIdentifier, "freedompay");
  assert.equal(sources[0].authorizedForAutomaticRetrieval, true);
  assert.equal(sources[0].productionNetworkAllowed, true);

  const entries = listSourceAuthorityEntries();
  const rollback = entries.map((entry) => entry.provider === "LEVER" && !entry.testOnly ? { ...entry, enabled: false, productionNetworkAllowed: false } : entry);
  assert.deepEqual(listAvailableAutomaticDiscoverySources(rollback), []);
});

test("Dun & Bradstreet is registered with governed enabled Lever authority", () => {
  const entries = listSourceAuthorityEntries();
  const dnb = entries.find((entry) => entry.sourceId === "lever-dnb");
  assert.ok(dnb);
  assert.equal(dnb.provider, "LEVER");
  assert.equal(dnb.interfaceType, "LEVER_POSTINGS_API");
  assert.equal(dnb.employerName, "Dun & Bradstreet");
  assert.equal(dnb.siteIdentifier, "dnb");
  assert.equal(dnb.leverSite, "dnb");
  assert.equal(dnb.leverRegion, "US");
  assert.equal(dnb.canonicalSourceUrl, "https://jobs.lever.co/dnb");
  assert.equal(dnb.authorityStatus, "AUTHORIZED");
  assert.equal(dnb.authorityEvidenceRef, "LEVER_PUBLIC_POSTINGS_THIRD_PARTY_SCRAPING_DOC_AND_DNB_OFFICIAL_CAREERS_LINK_2026-09-02");
  assert.equal(dnb.testOnly, false);
  assert.equal(dnb.enabled, true);
  assert.equal(dnb.productionNetworkAllowed, true);
});

test("Dun & Bradstreet is included in active automatic sources", () => {
  const entries = listSourceAuthorityEntries();
  const realLeverSources = entries.filter((entry) => entry.provider === "LEVER" && !entry.testOnly && entry.enabled);
  assert.deepEqual(realLeverSources.map((entry) => entry.sourceId), ["lever-freedompay", "lever-dnb"]);
  assert.equal(realLeverSources.length, 2);
  assert.equal(realLeverSources.filter((entry) => entry.productionNetworkAllowed).length, 2);
  assert.deepEqual(listAvailableAutomaticDiscoverySources().map((entry) => entry.sourceId), ["lever-freedompay", "lever-dnb"]);
  const authorization = authorizeSourceForAutomaticRetrieval("lever-dnb");
  assert.equal(authorization.authorized, true);
  assert.equal(authorization.code, "AUTHORIZED");
});

test("Dun & Bradstreet registration does not add unrelated real Lever employers", () => {
  const registryText = registrySource.toLowerCase();
  assert.doesNotMatch(registryText, /fieldai|field-ai|3pillar|3pillarglobal/);
});

test("registry inspection is static config only and performs no network or database mutation", () => {
  assert.doesNotMatch(registrySource, /fetch\s*\(/);
  assert.doesNotMatch(registrySource, /pool\.query|INSERT\s+INTO|UPDATE\s+"|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE/i);
});

test("authorized source snapshot is required for Greenhouse discovery ranking authority", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-greenhouse-approved", { registry: [source()] });
  const snapshot = publicSourceAuthoritySnapshot(authorization.source);
  assert.equal(isDiscoveryRecordSourceAuthorized({ provider: "GREENHOUSE", providerMetadata: { sourceAuthority: snapshot } }), true);
  assert.equal(isDiscoveryRecordSourceAuthorized({ provider: "GREENHOUSE" }), false);
  assert.equal(isDiscoveryRecordSourceAuthorized({ provider: "ASHBY", providerMetadata: { sourceAuthority: snapshot } }), false);
});

test("authorized source snapshot is required for Lever discovery ranking authority", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-lever-approved", { registry: [leverSource()] });
  const snapshot = publicSourceAuthoritySnapshot(authorization.source);
  assert.equal(isDiscoveryRecordSourceAuthorized({ provider: "LEVER", providerMetadata: { sourceAuthority: snapshot } }), true);
  assert.equal(isDiscoveryRecordSourceAuthorized({ provider: "LEVER" }), false);
  assert.equal(isDiscoveryRecordSourceAuthorized({ provider: "GREENHOUSE", providerMetadata: { sourceAuthority: snapshot } }), false);
});
