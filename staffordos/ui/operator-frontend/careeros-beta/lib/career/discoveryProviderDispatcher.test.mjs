import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { searchAuthorizedDiscoverySources } from "./discoveryProviderDispatcher.mjs";
import { DEFAULT_SOURCE_AUTHORITY_REGISTRY } from "./sourceAuthorityRegistry.mjs";

const dispatcherSource = readFileSync(new URL("./discoveryProviderDispatcher.mjs", import.meta.url), "utf8");

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

function adapters(calls) {
  return {
    GREENHOUSE: async ({ source, criteria }) => {
      calls.greenhouse = (calls.greenhouse || 0) + 1;
      assert.equal(source.retrievalAuthorized, true);
      assert.equal(criteria.keywords, "program manager");
      return { provider: "GREENHOUSE", providers: ["GREENHOUSE"], retrievedAt: "2026-09-01T12:00:00Z", results: [], criteria };
    },
    LEVER: async ({ source, criteria }) => {
      calls.lever = (calls.lever || 0) + 1;
      assert.equal(source.retrievalAuthorized, true);
      assert.equal(source.siteIdentifier, "approved-fixture");
      assert.equal(source.boardToken, null);
      assert.equal(criteria.keywords, "program manager");
      return { provider: "LEVER", providers: ["LEVER"], retrievedAt: "2026-09-01T12:00:00Z", results: [], criteria };
    },
    USAJOBS: async () => {
      calls.usajobs = (calls.usajobs || 0) + 1;
      return { provider: "USAJOBS", providers: ["USAJOBS"], results: [] };
    },
  };
}

async function assertBlocked(registry, code) {
  const calls = { greenhouse: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-greenhouse-approved"],
    criteria: { keywords: "program manager" },
    registry,
    adapters: adapters(calls),
  }), { code });
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
}

test("authorized enabled source permits adapter invocation", async () => {
  const calls = { greenhouse: 0, usajobs: 0 };
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["source-greenhouse-approved"],
    criteria: { keywords: "program manager" },
    registry: [source()],
    adapters: adapters(calls),
    now: new Date("2026-09-01T12:00:00Z"),
  });
  assert.equal(calls.greenhouse, 1);
  assert.equal(calls.usajobs, 0);
  assert.equal(result.provider, "GREENHOUSE");
  assert.deepEqual(result.sourceIds, ["source-greenhouse-approved"]);
});

test("authorized enabled Lever source permits adapter invocation", async () => {
  const calls = { greenhouse: 0, lever: 0, usajobs: 0 };
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager" },
    registry: [leverSource()],
    adapters: adapters(calls),
    now: new Date("2026-09-01T12:00:00Z"),
  });
  assert.equal(calls.lever, 1);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
  assert.equal(result.provider, "LEVER");
  assert.deepEqual(result.sourceIds, ["source-lever-approved"]);
});

test("authorized disabled source blocks network invocation", async () => {
  await assertBlocked([source({ enabled: false })], "SOURCE_DISABLED");
});

test("unverified source blocks network invocation", async () => {
  await assertBlocked([source({ authorityStatus: "UNVERIFIED" })], "SOURCE_UNVERIFIED");
});

test("written-approval-required source blocks network invocation", async () => {
  await assertBlocked([source({ authorityStatus: "WRITTEN_APPROVAL_REQUIRED" })], "SOURCE_WRITTEN_APPROVAL_REQUIRED");
});

test("unknown source blocks network invocation", async () => {
  const calls = { greenhouse: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["missing-source"],
    criteria: { keywords: "program manager" },
    registry: [source()],
    adapters: adapters(calls),
  }), { code: "SOURCE_NOT_FOUND" });
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("unknown provider blocks network invocation", async () => {
  const calls = { greenhouse: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-greenhouse-approved"],
    criteria: { keywords: "program manager" },
    registry: [source({ provider: "UNKNOWN_PROVIDER" })],
    adapters: adapters(calls),
  }), { code: "SOURCE_PROVIDER_UNKNOWN" });
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("Lever disabled source blocks before adapter invocation", async () => {
  const calls = { greenhouse: 0, lever: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager" },
    registry: [leverSource({ enabled: false })],
    adapters: adapters(calls),
  }), { code: "SOURCE_DISABLED" });
  assert.equal(calls.lever, 0);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("enabled source without production network permission blocks before adapter invocation", async () => {
  const calls = { greenhouse: 0, lever: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager" },
    registry: [leverSource({ productionNetworkAllowed: false })],
    adapters: adapters(calls),
  }), { code: "PRODUCTION_NETWORK_NOT_ALLOWED" });
  assert.equal(calls.lever, 0);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("activated FreedomPay source dispatches through the trusted registry entry", async () => {
  const calls = { greenhouse: 0, lever: 0, usajobs: 0 };
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["lever-freedompay"],
    criteria: {
      keywords: "site reliability",
      siteIdentifier: "attacker-site",
      privateEvidence: "PRIVATE_EVIDENCE_SHOULD_NOT_EGRESS",
      resume: "RESUME_SHOULD_NOT_EGRESS",
      userProfile: "PROFILE_SHOULD_NOT_EGRESS",
      capabilities: "CAPABILITIES_SHOULD_NOT_EGRESS",
      fitResult: "FIT_SHOULD_NOT_EGRESS",
      applicationMaterials: "APPLICATION_SHOULD_NOT_EGRESS",
    },
    registry: DEFAULT_SOURCE_AUTHORITY_REGISTRY,
    adapters: {
      LEVER: async ({ source, criteria }) => {
        calls.lever += 1;
        assert.equal(source.sourceId, "lever-freedompay");
        assert.equal(source.siteIdentifier, "freedompay");
        assert.equal(source.productionNetworkAllowed, true);
        assert.equal(criteria.siteIdentifier, "attacker-site");
        return { provider: "LEVER", providers: ["LEVER"], sourceIds: [source.sourceId], results: [], criteria };
      },
      GREENHOUSE: async () => {
        calls.greenhouse += 1;
        throw new Error("GREENHOUSE_ADAPTER_SHOULD_NOT_BE_CALLED");
      },
      USAJOBS: async () => {
        calls.usajobs += 1;
        throw new Error("USAJOBS_ADAPTER_SHOULD_NOT_BE_CALLED");
      },
    },
  });
  assert.equal(calls.lever, 1);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
  assert.equal(result.provider, "LEVER");
  assert.deepEqual(result.sourceIds, ["lever-freedompay"]);
  assert.deepEqual(result.results, []);
});

test("disabled FreedomPay rollback state blocks before adapter or network invocation", async () => {
  const calls = { greenhouse: 0, lever: 0, usajobs: 0 };
  const rollbackRegistry = DEFAULT_SOURCE_AUTHORITY_REGISTRY.map((entry) => entry.sourceId === "lever-freedompay" ? { ...entry, enabled: false, productionNetworkAllowed: false } : entry);
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["lever-freedompay"],
    criteria: {
      keywords: "site reliability",
      privateEvidence: "PRIVATE_EVIDENCE_SHOULD_NOT_EGRESS",
      resume: "RESUME_SHOULD_NOT_EGRESS",
      userProfile: "PROFILE_SHOULD_NOT_EGRESS",
      fitResult: "FIT_SHOULD_NOT_EGRESS",
    },
    registry: rollbackRegistry,
    adapters: {
      LEVER: async () => {
        calls.lever += 1;
        throw new Error("LEVER_ADAPTER_SHOULD_NOT_BE_CALLED");
      },
      GREENHOUSE: async () => {
        calls.greenhouse += 1;
        throw new Error("GREENHOUSE_ADAPTER_SHOULD_NOT_BE_CALLED");
      },
      USAJOBS: async () => {
        calls.usajobs += 1;
        throw new Error("USAJOBS_ADAPTER_SHOULD_NOT_BE_CALLED");
      },
    },
  }), { code: "SOURCE_DISABLED" });
  assert.equal(calls.lever, 0);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("Lever unverified source blocks before adapter invocation", async () => {
  const calls = { greenhouse: 0, lever: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager" },
    registry: [leverSource({ authorityStatus: "UNVERIFIED" })],
    adapters: adapters(calls),
  }), { code: "SOURCE_UNVERIFIED" });
  assert.equal(calls.lever, 0);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("Lever unauthorized source blocks before adapter invocation", async () => {
  const calls = { greenhouse: 0, lever: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager" },
    registry: [leverSource({ commercialMultiUserAllowed: false })],
    adapters: adapters(calls),
  }), { code: "SOURCE_PERMISSION_INCOMPLETE" });
  assert.equal(calls.lever, 0);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("Lever registry site identity is not taken from request criteria", async () => {
  const calls = { lever: 0 };
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager", siteIdentifier: "attacker-site", sourceUrl: "https://example.com/jobs" },
    registry: [leverSource()],
    adapters: {
      LEVER: async ({ source, criteria }) => {
        calls.lever += 1;
        assert.equal(source.siteIdentifier, "approved-fixture");
        assert.equal(source.sourceIdentifier, "approved-fixture");
        assert.equal(criteria.siteIdentifier, "attacker-site");
        return { provider: "LEVER", providers: ["LEVER"], results: [], criteria };
      },
    },
  });
  assert.equal(calls.lever, 1);
  assert.deepEqual(result.results, []);
});

test("missing source id blocks network invocation", async () => {
  const calls = { greenhouse: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: [],
    criteria: { keywords: "program manager" },
    registry: [source()],
    adapters: adapters(calls),
  }), { code: "SOURCE_ID_REQUIRED" });
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("one blocked source prevents partial retrieval from all sources", async () => {
  const calls = { greenhouse: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-greenhouse-approved", "source-disabled"],
    criteria: { keywords: "program manager" },
    registry: [source(), source({ sourceId: "source-disabled", enabled: false })],
    adapters: adapters(calls),
  }), { code: "SOURCE_DISABLED" });
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("provider failure does not fabricate dispatcher results", async () => {
  const calls = { greenhouse: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-greenhouse-approved"],
    criteria: { keywords: "program manager" },
    registry: [source()],
    adapters: {
      GREENHOUSE: async () => {
        calls.greenhouse += 1;
        throw Object.assign(new Error("GREENHOUSE_UNAVAILABLE"), { code: "GREENHOUSE_UNAVAILABLE" });
      },
      USAJOBS: async () => {
        calls.usajobs += 1;
        return { provider: "USAJOBS", providers: ["USAJOBS"], results: [] };
      },
    },
  }), { code: "GREENHOUSE_UNAVAILABLE" });
  assert.equal(calls.greenhouse, 1);
  assert.equal(calls.usajobs, 0);
});

test("Lever provider failure does not fall back to USAJOBS, Greenhouse, or synthetic results", async () => {
  const calls = { greenhouse: 0, lever: 0, usajobs: 0 };
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager" },
    registry: [leverSource()],
    adapters: {
      LEVER: async () => {
        calls.lever += 1;
        throw Object.assign(new Error("LEVER_PROVIDER_FAILURE"), { code: "LEVER_PROVIDER_FAILURE" });
      },
      GREENHOUSE: async () => {
        calls.greenhouse += 1;
        return { provider: "GREENHOUSE", providers: ["GREENHOUSE"], results: [{ title: "Fallback" }] };
      },
      USAJOBS: async () => {
        calls.usajobs += 1;
        return { provider: "USAJOBS", providers: ["USAJOBS"], results: [{ title: "Fallback" }] };
      },
    },
  }), { code: "LEVER_PROVIDER_FAILURE" });
  assert.equal(calls.lever, 1);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
});

test("Lever zero-result response remains zero through the dispatcher", async () => {
  const calls = { lever: 0 };
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager" },
    registry: [leverSource()],
    adapters: {
      LEVER: async () => {
        calls.lever += 1;
        return { provider: "LEVER", providers: ["LEVER"], results: [] };
      },
    },
  });
  assert.equal(calls.lever, 1);
  assert.equal(result.provider, "LEVER");
  assert.deepEqual(result.results, []);
});

test("disabled Dun & Bradstreet source blocks before adapter invocation", async () => {
  const calls = { lever: 0, greenhouse: 0, usajobs: 0 };
  const rollbackRegistry = DEFAULT_SOURCE_AUTHORITY_REGISTRY.map((entry) => entry.sourceId === "lever-dnb" ? { ...entry, enabled: false, productionNetworkAllowed: false } : entry);
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["lever-dnb"],
    criteria: { keywords: "product manager" },
    registry: rollbackRegistry,
    adapters: {
      LEVER: async () => {
        calls.lever += 1;
        throw new Error("DNB_ADAPTER_SHOULD_NOT_BE_CALLED");
      },
      GREENHOUSE: async () => {
        calls.greenhouse += 1;
        throw new Error("GREENHOUSE_ADAPTER_SHOULD_NOT_BE_CALLED");
      },
      USAJOBS: async () => {
        calls.usajobs += 1;
        throw new Error("USAJOBS_ADAPTER_SHOULD_NOT_BE_CALLED");
      },
    },
  }), { code: "SOURCE_DISABLED" });
  assert.deepEqual(calls, { lever: 0, greenhouse: 0, usajobs: 0 });
});

test("authorized Dun & Bradstreet source dispatches through the trusted registry", async () => {
  const calls = { lever: 0, greenhouse: 0, usajobs: 0 };
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["lever-dnb"],
    criteria: { keywords: "product manager" },
    registry: DEFAULT_SOURCE_AUTHORITY_REGISTRY,
    adapters: {
      LEVER: async ({ source }) => {
        calls.lever += 1;
        assert.equal(source.sourceId, "lever-dnb");
        assert.equal(source.siteIdentifier, "dnb");
        assert.equal(source.leverRegion, "US");
        assert.equal(source.retrievalAuthorized, true);
        return { provider: "LEVER", providers: ["LEVER"], sourceIds: [source.sourceId], results: [] };
      },
      GREENHOUSE: async () => { calls.greenhouse += 1; throw new Error("GREENHOUSE_SHOULD_NOT_BE_CALLED"); },
      USAJOBS: async () => { calls.usajobs += 1; throw new Error("USAJOBS_SHOULD_NOT_BE_CALLED"); },
    },
  });
  assert.equal(calls.lever, 1);
  assert.equal(calls.greenhouse, 0);
  assert.equal(calls.usajobs, 0);
  assert.deepEqual(result.sourceIds, ["lever-dnb"]);
  assert.deepEqual(result.results, []);
});

test("both active Lever sources dispatch as one governed source-registry request", async () => {
  const calls = [];
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["lever-freedompay", "lever-dnb"],
    criteria: { keywords: "product manager" },
    registry: DEFAULT_SOURCE_AUTHORITY_REGISTRY,
    adapters: {
      LEVER: async ({ source }) => {
        calls.push({ sourceId: source.sourceId, siteIdentifier: source.siteIdentifier });
        return { provider: "LEVER", providers: ["LEVER"], sourceIds: [source.sourceId], results: [] };
      },
    },
  });
  assert.deepEqual(calls, [
    { sourceId: "lever-freedompay", siteIdentifier: "freedompay" },
    { sourceId: "lever-dnb", siteIdentifier: "dnb" },
  ]);
  assert.deepEqual(result.sourceIds, ["lever-freedompay", "lever-dnb"]);
  assert.deepEqual(result.results, []);
});

test("source telemetry preserves earlier completion when a later provider fails", async () => {
  const calls = [];
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["lever-freedompay", "lever-dnb"],
    criteria: { keywords: "product manager" },
    registry: DEFAULT_SOURCE_AUTHORITY_REGISTRY,
    adapters: {
      LEVER: async ({ source }) => {
        calls.push(source.sourceId);
        if (source.sourceId === "lever-dnb") throw Object.assign(new Error("provider details must not be logged"), { code: "LEVER_TIMEOUT" });
        return { provider: "LEVER", results: [{ sourceId: source.sourceId }] };
      },
    },
  });
  assert.equal(result.searchOutcome, "PARTIAL_SUCCESS");
  assert.equal(result.partialFailure, true);
  assert.equal(result.successfulSourceCount, 1);
  assert.equal(result.failedSourceCount, 1);
  assert.equal(result.results.length, 1);
  assert.equal(result.sourceTelemetry[0].dispatchCompleted, true);
  assert.equal(result.sourceTelemetry[0].providerRecordCount, 1);
  assert.equal(result.sourceTelemetry[1].dispatchAttempted, true);
  assert.equal(result.sourceTelemetry[1].dispatchCompleted, false);
  assert.equal(result.sourceTelemetry[1].providerOutcome, "BOUNDED_ERROR");
  assert.equal(result.sourceTelemetry[1].providerFailureCategory, "TIMEOUT");
  assert.deepEqual(calls, ["lever-freedompay", "lever-dnb"]);
});

test("a successful source after a failed source is retained without fallback", async () => {
  const calls = [];
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-failing", "source-lever-successful"],
    criteria: { keywords: "program manager" },
    registry: [leverSource({ sourceId: "source-lever-failing" }), leverSource({ sourceId: "source-lever-successful" })],
    adapters: {
      LEVER: async ({ source }) => {
        calls.push(source.sourceId);
        if (source.sourceId === "source-lever-failing") throw Object.assign(new Error("private provider detail"), { code: "LEVER_PROVIDER_FAILURE", providerHttpStatus: 404 });
        return { provider: "LEVER", results: [{ sourceId: source.sourceId }] };
      },
      GREENHOUSE: async () => { throw new Error("fallback must not run"); },
    },
  });
  assert.deepEqual(calls, ["source-lever-failing", "source-lever-successful"]);
  assert.equal(result.searchOutcome, "PARTIAL_SUCCESS");
  assert.equal(result.successfulSourceCount, 1);
  assert.equal(result.failedSourceCount, 1);
  assert.equal(result.results.length, 1);
  assert.deepEqual(result.failedSources, [{ sourceId: "source-lever-failing", provider: "LEVER", errorClass: "LEVER_PROVIDER_FAILURE", providerFailureCategory: "HTTP_STATUS_FAILURE", providerHttpStatus: 404 }]);
});

test("all provider failures remain a bounded total failure", async () => {
  const calls = [];
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-one", "source-lever-two"],
    registry: [leverSource({ sourceId: "source-lever-one" }), leverSource({ sourceId: "source-lever-two" })],
    adapters: {
      LEVER: async ({ source }) => {
        calls.push(source.sourceId);
        throw Object.assign(new Error("raw failure must not escape"), { code: "LEVER_TIMEOUT" });
      },
    },
  }), (error) => {
    assert.equal(error.code, "LEVER_TIMEOUT");
    assert.equal(error.discoveryTelemetry.searchOutcome, "FAILURE");
    assert.equal(error.discoveryTelemetry.successfulSourceCount, 0);
    assert.equal(error.discoveryTelemetry.failedSourceCount, 2);
    return true;
  });
  assert.deepEqual(calls, ["source-lever-one", "source-lever-two"]);
});

test("a successful zero-result source plus a failed source is partial success", async () => {
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-zero", "source-lever-failing"],
    registry: [leverSource({ sourceId: "source-lever-zero" }), leverSource({ sourceId: "source-lever-failing" })],
    adapters: {
      LEVER: async ({ source }) => {
        if (source.sourceId === "source-lever-failing") throw Object.assign(new Error("provider failure"), { code: "LEVER_PROVIDER_FAILURE", providerHttpStatus: 503 });
        return { provider: "LEVER", results: [] };
      },
    },
  });
  assert.equal(result.searchOutcome, "PARTIAL_SUCCESS");
  assert.equal(result.partialFailure, true);
  assert.equal(result.results.length, 0);
  assert.equal(result.sourceTelemetry[0].providerOutcome, "ZERO");
  assert.equal(result.sourceTelemetry[1].providerFailureCategory, "HTTP_STATUS_FAILURE");
});

test("the observed two-successes-then-404 scenario preserves all 20 successful records", async () => {
  const registry = [
    leverSource({ sourceId: "lever-freedompay" }),
    leverSource({ sourceId: "lever-dnb" }),
    leverSource({ sourceId: "lever-frontify" }),
  ];
  const result = await searchAuthorizedDiscoverySources({
    sourceIds: ["lever-freedompay", "lever-dnb", "lever-frontify"],
    registry,
    adapters: {
      LEVER: async ({ source }) => {
        if (source.sourceId === "lever-frontify") throw Object.assign(new Error("404 body must not escape"), { code: "LEVER_PROVIDER_FAILURE", providerFailureCategory: "HTTP_STATUS_FAILURE", providerHttpStatus: 404, responseBody: "private body" });
        return { provider: "LEVER", results: Array.from({ length: 10 }, (_, index) => ({ sourceId: source.sourceId, providerJobId: `${source.sourceId}-${index}` })) };
      },
    },
  });
  assert.equal(result.searchOutcome, "PARTIAL_SUCCESS");
  assert.equal(result.successfulSourceCount, 2);
  assert.equal(result.failedSourceCount, 1);
  assert.equal(result.results.length, 20);
  assert.equal(result.sourceTelemetry[2].providerFailureCategory, "HTTP_STATUS_FAILURE");
  assert.equal(result.sourceTelemetry[2].providerHttpStatus, 404);
  assert.doesNotMatch(JSON.stringify(result), /404 body|private body/);
});

test("dispatcher preserves bounded provider failure category and HTTP status", async () => {
  const unsafe = "provider body\n\\\"fakeField\\\":true https://evil.example/?token=secret";
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["source-lever-approved"],
    criteria: { keywords: "program manager" },
    registry: [leverSource()],
    adapters: {
      LEVER: async () => {
        throw Object.assign(new Error(unsafe), {
          code: "LEVER_PROVIDER_FAILURE",
          providerFailureCategory: "HTTP_STATUS_FAILURE",
          providerHttpStatus: 502,
          responseBody: unsafe,
        });
      },
    },
  }), (error) => {
    const telemetry = error.discoveryTelemetry.sourceTelemetry[0];
    assert.equal(error.code, "LEVER_PROVIDER_FAILURE");
    assert.equal(telemetry.providerFailureCategory, "HTTP_STATUS_FAILURE");
    assert.equal(telemetry.providerHttpStatus, 502);
    assert.doesNotMatch(JSON.stringify(telemetry), /fakeField|evil\\.example|token=secret|provider body/);
    return true;
  });
});

test("Dun & Bradstreet rollback disables only D&B and preserves FreedomPay", async () => {
  const calls = { lever: [] };
  const rollbackRegistry = DEFAULT_SOURCE_AUTHORITY_REGISTRY.map((entry) => entry.sourceId === "lever-dnb" ? { ...entry, enabled: false, productionNetworkAllowed: false } : entry);
  const freedomPay = await searchAuthorizedDiscoverySources({
    sourceIds: ["lever-freedompay"],
    registry: rollbackRegistry,
    adapters: { LEVER: async ({ source }) => { calls.lever.push(source.sourceId); return { provider: "LEVER", results: [] }; } },
  });
  assert.deepEqual(freedomPay.sourceIds, ["lever-freedompay"]);
  await assert.rejects(() => searchAuthorizedDiscoverySources({
    sourceIds: ["lever-dnb"],
    registry: rollbackRegistry,
    adapters: { LEVER: async () => { calls.lever.push("unexpected"); return { provider: "LEVER", results: [] }; } },
  }), { code: "SOURCE_DISABLED" });
  assert.deepEqual(calls.lever, ["lever-freedompay"]);
});

test("dispatcher does not mutate opportunities, lifecycle, customer decisions, or database state", () => {
  assert.doesNotMatch(dispatcherSource, /CareerOpportunity|decisionState|lifecycleState|CareerEvidence|CareerFact|ResumeVersion/);
  assert.doesNotMatch(dispatcherSource, /pool\.query|INSERT\s+INTO|UPDATE\s+"|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE/i);
});
