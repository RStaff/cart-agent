import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sanitizeCapabilityDerivationTrace, sanitizeCapabilityExecutionTrace, sanitizeCapabilityReconciliationTrace } from "./capabilityTrace.mjs";
import { compareCapabilityDerivationInputs, summarizeFactShape } from "./capabilityDiagnostic.mjs";

const routePath = new URL("../../app/api/career/internal/capability-reconciliation-trace/route.ts", import.meta.url);
const routeSource = fs.readFileSync(routePath, "utf8");

test("trace sanitization exposes lifecycle states but no evidence or identifiers", () => {
  const output = sanitizeCapabilityReconciliationTrace([
    {
      capabilityKey: "PROGRAM_DELIVERY",
      expectedAuthorityState: "NEEDS_MORE_EVIDENCE",
      priorAuthorityState: "VERIFIED_DIRECT",
      profileId: "profile-secret",
      existingAuthority: true,
      updateAttempted: true,
      updateRowCount: 1,
      insertAttempted: false,
      readbackAuthorityState: "NEEDS_MORE_EVIDENCE",
      returnedAuthorityState: "NEEDS_MORE_EVIDENCE",
      reconciliationSucceeded: true,
      publicAuthorityState: "NEEDS_MORE_EVIDENCE",
      capabilityNeedsReview: true,
      statement: "private career evidence",
      sourceExcerpt: "private source excerpt",
    },
    { profileId: "profile-secret", reviewed: 1, total: 2, completion: false },
  ]);

  assert.deepEqual(output, {
    capabilities: [{
      capabilityKey: "PROGRAM_DELIVERY",
      expectedAuthorityState: "NEEDS_MORE_EVIDENCE",
      priorAuthorityState: "VERIFIED_DIRECT",
      existingAuthorityFound: true,
      reconciliationEntered: true,
      updateAttempted: true,
      updateRowCount: 1,
      insertAttempted: false,
      readbackAuthorityState: "NEEDS_MORE_EVIDENCE",
      returnedAuthorityState: "NEEDS_MORE_EVIDENCE",
      reconciliationSucceeded: true,
      publicAuthorityState: "NEEDS_MORE_EVIDENCE",
      capabilityNeedsReview: true,
    }],
    request: { reviewedCount: 1, totalCount: 2, completionResult: false, sameAuthenticatedProfileScope: true },
  });
  assert.equal(JSON.stringify(output).includes("private"), false);
  assert.equal(JSON.stringify(output).includes("profile-secret"), false);
});

test("derivation trace exposes candidate and lifecycle entry keys without identifiers", () => {
  const output = sanitizeCapabilityDerivationTrace({
    candidateKeys: ["PROGRAM_DELIVERY"],
    refreshInvokedKeys: ["PROGRAM_DELIVERY"],
    reconciliationEnteredKeys: ["PROGRAM_DELIVERY"],
    reconciliationReturnedKeys: ["PROGRAM_DELIVERY"],
    profileId: "private-profile",
    statement: "private evidence",
  });
  assert.deepEqual(output, {
    candidateKeys: ["PROGRAM_DELIVERY"],
    refreshInvokedKeys: ["PROGRAM_DELIVERY"],
    reconciliationEnteredKeys: ["PROGRAM_DELIVERY"],
    reconciliationReturnedKeys: ["PROGRAM_DELIVERY"],
  });
  assert.equal(JSON.stringify(output).includes("private"), false);
});

test("execution trace preserves canonical call-graph stages without private data", () => {
  const output = sanitizeCapabilityExecutionTrace({
    getCapabilityProfileEntered: true,
    getCapabilitiesEntered: true,
    deriveCapabilitiesEntered: true,
    factQueryExecuted: true,
    factCountInsideDeriveCapabilities: 33,
    deriveCapabilityCandidatesCalled: true,
    candidateCountInsideDeriveCapabilities: 4,
    candidateKeysInsideDeriveCapabilities: ["PROGRAM_DELIVERY"],
    deriveCapabilitiesReturnedCount: 4,
    getCapabilitiesReturnedCount: 4,
    getCapabilityProfileReturnedCount: 4,
    includeTraceAtProfile: true,
    includeTraceAtGetCapabilities: true,
    includeTraceAtDeriveCapabilities: true,
    profileId: "private-profile",
    statement: "private evidence",
  });
  assert.equal(output.factCountInsideDeriveCapabilities, 33);
  assert.equal(output.candidateCountInsideDeriveCapabilities, 4);
  assert.deepEqual(output.candidateKeysInsideDeriveCapabilities, ["PROGRAM_DELIVERY"]);
  assert.equal(JSON.stringify(output).includes("private"), false);
});

test("trace route is authenticated, canonical, uncached, and read-only at the customer boundary", () => {
  assert.match(routeSource, /currentCareerContext/);
  assert.match(routeSource, /if \(!context\).*401/s);
  assert.match(routeSource, /getCapabilityProfile\(context, \{ includeTrace: true, executionTrace \}\)/);
  assert.match(routeSource, /Cache-Control/);
  assert.doesNotMatch(routeSource, /CareerFact|sourceExcerpt|statement|tenantId|profileId/);
});

test("normal capability route remains opt-in for its existing trace behavior", () => {
  const normalRoute = fs.readFileSync(new URL("../../app/api/career/capabilities/route.ts", import.meta.url), "utf8");
  assert.match(normalRoute, /traceEnabled/);
  assert.match(normalRoute, /includeTrace: traceEnabled\(\)/);
});

test("diagnostic and canonical fact sets produce the same candidate keys when inputs match", () => {
  const facts = [{ id: "fact-1", sourceId: "source-1", factType: "PROJECT", statement: "Managed a cross-functional migration.", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }];
  const result = compareCapabilityDerivationInputs({ diagnosticFacts: facts, canonicalFacts: facts });
  assert.equal(result.sameFactCount, true);
  assert.equal(result.sameCandidateKeys, true);
  assert.equal(result.firstDivergence, null);
});

test("comparison identifies canonical source-join filtering without exposing evidence", () => {
  const diagnosticFacts = [{ id: "fact-1", sourceId: "missing-source", factType: "PROJECT", statement: "Managed a cross-functional migration.", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }];
  const result = compareCapabilityDerivationInputs({ diagnosticFacts, canonicalFacts: [] });
  assert.equal(result.firstDivergence, "CANONICAL_FACT_FILTER");
  assert.equal(result.diagnosticFactCount, 1);
  assert.equal(result.canonicalFactCount, 0);
  assert.deepEqual(result.diagnosticCandidateKeys, ["CROSS_FUNCTIONAL_COORDINATION", "PROGRAM_DELIVERY"]);
  assert.deepEqual(result.canonicalCandidateKeys, []);
  assert.equal(JSON.stringify(result).includes("Managed"), false);
  assert.equal(JSON.stringify(result).includes("fact-1"), false);
});

test("fact shape summary exposes structure without values or identifiers", () => {
  const shape = summarizeFactShape([{ id: "fact-1", sourceId: "source-1", factType: "PROJECT", statement: "private", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED", scopeStatement: null }]);
  assert.equal(shape.count, 1);
  assert.deepEqual(shape.presentCounts, { statement: 1, factType: 1, authorityState: 1, sourceType: 0, scopeStatement: 0, sourceId: 1 });
  assert.deepEqual(shape.typeCounts.statement, ["string"]);
  assert.equal(JSON.stringify(shape).includes("private"), false);
  assert.equal(JSON.stringify(shape).includes("fact-1"), false);
});
