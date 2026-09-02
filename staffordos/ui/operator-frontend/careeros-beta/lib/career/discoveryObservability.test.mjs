import assert from "node:assert/strict";
import test from "node:test";
import { buildDiscoveryObservability, classifyDiscoveryError } from "./discoveryObservability.mjs";

function result(classification) {
  return { roleCompatibility: { classification } };
}

test("discovery observability reports bounded multi-source and pipeline counters", () => {
  const summary = buildDiscoveryObservability({
    requestId: "request-1",
    normalizedRoleFamily: "PRODUCT_TECHNICAL_PRODUCT",
    sourceIds: ["lever-freedompay", "lever-dnb"],
    sourceTelemetry: [
      { sourceId: "lever-freedompay", provider: "LEVER", authorityResult: "AUTHORIZED", enabled: true, productionNetworkAllowed: true, dispatchAttempted: true, dispatchCompleted: true, providerOutcome: "SUCCESS", providerRecordCount: 2, normalizedRecordCount: 2 },
      { sourceId: "lever-dnb", provider: "LEVER", authorityResult: "AUTHORIZED", enabled: true, productionNetworkAllowed: true, dispatchAttempted: true, dispatchCompleted: true, providerOutcome: "ZERO", providerRecordCount: 0, normalizedRecordCount: 0 },
    ],
    providerRecordCount: 2,
    normalizedRecordCount: 2,
    rankedResults: [result("EXACT_OR_NEAR_TITLE"), result("INCOMPATIBLE")],
    finalRankedResults: [result("EXACT_OR_NEAR_TITLE")],
    diagnostics: { p0RoleGateSurvivors: 1 },
  });
  assert.equal(summary.requestId, "request-1");
  assert.equal(summary.normalizedRoleFamily, "PRODUCT_TECHNICAL_PRODUCT");
  assert.deepEqual(summary.sourceIds, ["lever-freedompay", "lever-dnb"]);
  assert.equal(summary.sourceCount, 2);
  assert.equal(summary.totalProviderRecordCount, 2);
  assert.equal(summary.normalizedRecordCount, 2);
  assert.equal(summary.preDedupeRecordCount, 2);
  assert.equal(summary.postDedupeRecordCount, 2);
  assert.equal(summary.duplicateCount, 0);
  assert.deepEqual(summary.compatibilityCounts, { EXACT_OR_NEAR_TITLE: 1, COMPATIBLE_ADJACENT: 0, ROLE_FAMILY_ONLY: 0, INCOMPATIBLE: 1 });
  assert.equal(summary.p0RoleGateSurvivorCount, 1);
  assert.equal(summary.finalRankedCount, 1);
  assert.equal(summary.syntheticFallback, false);
});

test("discovery observability distinguishes zero, disabled, network denial, and bounded failure", () => {
  const summary = buildDiscoveryObservability({
    requestId: "request-2",
    sourceIds: ["lever-freedompay", "lever-dnb"],
    sourceTelemetry: [
      { sourceId: "lever-freedompay", provider: "LEVER", authorityResult: "AUTHORIZED", enabled: true, productionNetworkAllowed: true, dispatchAttempted: true, dispatchCompleted: true, providerOutcome: "ZERO", providerRecordCount: 0 },
      { sourceId: "lever-dnb", provider: "LEVER", authorityResult: "PRODUCTION_NETWORK_NOT_ALLOWED", enabled: true, productionNetworkAllowed: false, dispatchAttempted: false, dispatchCompleted: false, providerOutcome: "NETWORK_NOT_ALLOWED", errorClass: "PRODUCTION_NETWORK_NOT_ALLOWED" },
    ],
    outcome: "BOUNDED_ERROR",
    errorClass: "LEVER_TIMEOUT",
  });
  assert.equal(summary.sources[0].providerOutcome, "ZERO");
  assert.equal(summary.sources[1].providerOutcome, "NETWORK_NOT_ALLOWED");
  assert.equal(summary.sources[1].dispatchAttempted, false);
  assert.equal(summary.outcome, "BOUNDED_ERROR");
  assert.equal(summary.errorClass, "LEVER_TIMEOUT");
});

test("observability is aggregate-only and excludes private or raw provider fields", () => {
  const summary = buildDiscoveryObservability({
    requestId: "request-3",
    sourceIds: ["lever-dnb"],
    sourceTelemetry: [{ sourceId: "lever-dnb", provider: "LEVER", providerRecordCount: 1 }],
    providerRecordCount: 1,
    rankedResults: [result("INCOMPATIBLE")],
  });
  const serialized = JSON.stringify(summary);
  for (const forbidden of ["description", "resume", "email", "cookie", "authorization", "token", "password", "apiKey", "sourceUrl"]) assert.doesNotMatch(serialized, new RegExp(forbidden, "i"));
  assert.equal(Object.hasOwn(summary, "requestId"), true);
  assert.equal(Object.hasOwn(summary, "sourceIds"), true);
});

test("error telemetry uses bounded classifications instead of exception content", () => {
  const adversarial = "LEVER_TIMEOUT\n\\\"fakeField\\\":true https://evil.example/?token=secret token@example.com".repeat(100);
  assert.equal(classifyDiscoveryError({ code: "LEVER_TIMEOUT", message: adversarial, stack: adversarial }), "LEVER_TIMEOUT");
  assert.equal(classifyDiscoveryError({ message: adversarial, stack: adversarial }), "INTERNAL_DISCOVERY_ERROR");
  const summary = buildDiscoveryObservability({
    requestId: "request-4",
    sourceIds: ["lever-freedompay", "lever-dnb"],
    sourceTelemetry: [{ sourceId: "lever-dnb", provider: "LEVER", errorClass: adversarial }],
    outcome: "BOUNDED_ERROR",
    errorClass: adversarial,
  });
  const serialized = JSON.stringify(summary);
  assert.match(serialized, /INTERNAL_DISCOVERY_ERROR/);
  assert.doesNotMatch(serialized, /fakeField|evil\.example|token@example\.com|secret/);
  assert.doesNotMatch(serialized, /LEVER_TIMEOUT\\n/);
});
