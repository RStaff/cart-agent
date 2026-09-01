import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  authorizeSourceForAutomaticRetrieval,
  isDiscoveryRecordSourceAuthorized,
  normalizeSourceAuthorityEntry,
  publicSourceAuthoritySnapshot,
  safeGreenhouseBoardToken,
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

test("authorized enabled Greenhouse source permits retrieval", () => {
  const authorization = authorizeSourceForAutomaticRetrieval("source-greenhouse-approved", { registry: [source()] });
  assert.equal(authorization.authorized, true);
  assert.equal(authorization.source.retrievalAuthorized, true);
  assert.equal(authorization.source.provider, "GREENHOUSE");
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

test("default registry has no enabled production Greenhouse source", () => {
  const summary = sourceAuthorityRegistrySummary();
  assert.equal(summary.defaultProductionGreenhouseSourcesEnabled, false);
  assert.equal(summary.productionEnabledGreenhouseSourceCount, 0);
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
