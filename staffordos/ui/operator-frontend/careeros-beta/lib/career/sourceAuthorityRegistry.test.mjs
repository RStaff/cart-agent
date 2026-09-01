import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  authorizeSourceForAutomaticRetrieval,
  isDiscoveryRecordSourceAuthorized,
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

test("default registry has no enabled production Lever source", () => {
  const summary = sourceAuthorityRegistrySummary();
  assert.equal(summary.defaultProductionLeverSourcesEnabled, false);
  assert.equal(summary.productionEnabledLeverSourceCount, 0);
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
