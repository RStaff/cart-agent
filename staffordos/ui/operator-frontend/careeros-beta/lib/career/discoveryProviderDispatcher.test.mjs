import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { searchAuthorizedDiscoverySources } from "./discoveryProviderDispatcher.mjs";

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
    lastReviewedAt: "2026-09-01",
    ...overrides,
  };
}

function adapters(calls) {
  return {
    GREENHOUSE: async ({ source, criteria }) => {
      calls.greenhouse += 1;
      assert.equal(source.retrievalAuthorized, true);
      assert.equal(criteria.keywords, "program manager");
      return { provider: "GREENHOUSE", providers: ["GREENHOUSE"], retrievedAt: "2026-09-01T12:00:00Z", results: [], criteria };
    },
    USAJOBS: async () => {
      calls.usajobs += 1;
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

test("dispatcher does not mutate opportunities, lifecycle, customer decisions, or database state", () => {
  assert.doesNotMatch(dispatcherSource, /CareerOpportunity|decisionState|lifecycleState|CareerEvidence|CareerFact|ResumeVersion/);
  assert.doesNotMatch(dispatcherSource, /pool\.query|INSERT\s+INTO|UPDATE\s+"|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE/i);
});
