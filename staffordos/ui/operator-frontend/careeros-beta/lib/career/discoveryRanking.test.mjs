import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDiscoveryResult, rankDiscoveryResults } from "./discoveryRanking.mjs";
import { buildPersonalizedSearchIntent } from "./discoverySearchIntent.mjs";

const intent = buildPersonalizedSearchIntent({
  preferences: { keywords: "program manager", location: "Boston", remotePreference: "remote", salaryMin: 100000, resultLimit: 10 },
  facts: [{ id: "fact-1", statement: "Private marker: led cross-functional program delivery.", factType: "PROJECT", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }],
  capabilities: [
    { capabilityKey: "PROGRAM_DELIVERY", label: "Program delivery", authorityState: "VERIFIED_DIRECT", provenance: { factIds: ["fact-1"] } },
    { capabilityKey: "TECHNOLOGY_IMPLEMENTATION", label: "Technology implementation", authorityState: "VERIFIED_TRANSFERABLE", provenance: { factIds: ["fact-2"] } },
    { capabilityKey: "CROSS_FUNCTIONAL_COORDINATION", label: "Cross-functional coordination", authorityState: "VERIFIED_DIRECT", provenance: { factIds: ["fact-3"] } }
  ]
});

function result(overrides) {
  return normalizeDiscoveryResult({
    sourceProvider: "USAJOBS",
    externalOpportunityId: overrides.id,
    title: overrides.title,
    company: "Example",
    location: overrides.location || "Remote",
    sourceUrl: `https://example.com/jobs/${overrides.id}`,
    description: overrides.description,
    postedAt: overrides.postedAt || "2026-08-20T00:00:00Z",
    closingAt: overrides.closingAt || "2026-09-20T00:00:00Z",
    salaryMin: overrides.salaryMin ?? 120000,
    employmentType: overrides.employmentType || "Full Time",
    retrievedAt: "2026-08-28T12:00:00Z"
  });
}

test("provider results normalize into one transient contract", () => {
  const item = result({ id: "1", title: "Program Manager", description: "Responsibilities: Lead program delivery and coordinate stakeholders." });
  assert.equal(item.provider, "USAJOBS");
  assert.equal(item.providerJobId, "1");
  assert.equal(item.externalOpportunityId, "1");
  assert.equal(item.sourceProvider, "USAJOBS");
  assert.equal(item.persisted, false);
});

test("evidence-backed adjacent roles outrank weak exact-title matches", () => {
  const ranked = rankDiscoveryResults({
    intent,
    capabilities: intent.authority.capabilities,
    results: [
      result({ id: "weak", title: "Program Manager", description: "Overview: Join our team. Qualifications: Excellent communication skills." }),
      result({ id: "strong", title: "Technology Implementation Lead", description: "Responsibilities:\nLead cross-functional program delivery.\nCoordinate stakeholders across technical teams.\nImplement workflow automation and platform improvements." })
    ],
    existingStatuses: {},
    now: new Date("2026-08-28T12:00:00Z")
  }).results;
  assert.equal(ranked[0].providerJobId, "strong");
  assert.equal(ranked[0].recommendation, "STRONG_CANDIDATE");
});

test("missing descriptions cannot become high-confidence matches", () => {
  const ranked = rankDiscoveryResults({
    intent,
    capabilities: intent.authority.capabilities,
    results: [result({ id: "missing", title: "Program Manager", description: "" })],
    existingStatuses: {},
    now: new Date("2026-08-28T12:00:00Z")
  }).results[0];
  assert.equal(ranked.quality.gates.usefulDescription, false);
  assert.notEqual(ranked.recommendation, "STRONG_CANDIDATE");
});

test("duplicate results are penalized and marked as not top-quality candidates", () => {
  const ranked = rankDiscoveryResults({
    intent,
    capabilities: intent.authority.capabilities,
    results: [result({ id: "duplicate", title: "Program Manager", description: "Responsibilities: Lead cross-functional program delivery." })],
    existingStatuses: { duplicate: "Already in Inbox" },
    now: new Date("2026-08-28T12:00:00Z")
  }).results[0];
  assert.equal(ranked.quality.gates.duplicateFree, false);
  assert.ok(ranked.negativeSignals.includes("Already saved or reviewed"));
});

test("unsupported hard requirements penalize ranking", () => {
  const ranked = rankDiscoveryResults({
    intent,
    capabilities: intent.authority.capabilities,
    results: [result({ id: "blocked", title: "Program Manager", description: "Required experience:\nMust hold an active security clearance.\nLead cross-functional program delivery." })],
    existingStatuses: {},
    now: new Date("2026-08-28T12:00:00Z")
  }).results[0];
  assert.ok(ranked.negativeSignals.some((signal) => /specialist|clearance/i.test(signal)));
  assert.notEqual(ranked.recommendation, "STRONG_CANDIDATE");
});

test("direct and transferable evidence remain distinguishable", () => {
  const ranked = rankDiscoveryResults({
    intent,
    capabilities: intent.authority.capabilities,
    results: [result({ id: "mixed", title: "Technical Program Manager", description: "Responsibilities:\nLead program delivery.\nImplement technology platforms and technical tools." })],
    existingStatuses: {},
    now: new Date("2026-08-28T12:00:00Z")
  }).results[0];
  assert.ok(ranked.qualification.directEvidence > 0);
  assert.ok(ranked.qualification.transferableEvidence > 0);
});

test("ranking explanations reference confirmed capability labels only", () => {
  const ranked = rankDiscoveryResults({
    intent,
    capabilities: intent.authority.capabilities,
    results: [result({ id: "explain", title: "Technical Program Manager", description: "Responsibilities:\nLead program delivery.\nImplement technology platforms and technical tools." })],
    existingStatuses: {},
    now: new Date("2026-08-28T12:00:00Z")
  }).results[0];
  const explanation = JSON.stringify(ranked.discoveryExplanation);
  assert.match(explanation, /Program delivery/);
  assert.doesNotMatch(explanation, /Private marker/);
});
