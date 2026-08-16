import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { projectCapabilityRequirementRelationships } from "./careerOsV1_27AOfflineCapabilityGraph.mjs";

const root = process.cwd().endsWith("operator-frontend") ? path.resolve(process.cwd(), "../..") : process.cwd();
const artifact = (name) => JSON.parse(readFileSync(path.join(root, "job-search", name), "utf8"));

test("post-adjudication authority is complete, sanitized, and deterministic", () => {
  const authority = artifact("CAREEROS_V1_27A2_CAPABILITY_AUTHORITY.json");
  const determinism = artifact("CAREEROS_V1_27A2_DETERMINISM.json");
  assert.equal(authority.activeDecisionCount, 10);
  assert.equal(authority.appendOnlyRecordCount, 10);
  assert.equal(authority.supersededDecisionCount, 0);
  assert.deepEqual(authority.decisionDistribution, { KEEP_UNRESOLVED: 1, VERIFIED_DIRECT: 9 });
  assert.equal(determinism.identical, true);
  assert.equal(determinism.capabilityAuthorityHash, determinism.repeatCapabilityAuthorityHash);
  assert.equal(determinism.requirementProjectionHash, determinism.repeatRequirementProjectionHash);
  assert.equal(determinism.conceptProjectionHash, determinism.repeatConceptProjectionHash);
});

test("exact requirement projection preserves identity and remains fail-closed", () => {
  const projection = artifact("CAREEROS_V1_27A2_REQUIREMENT_PROJECTION.json");
  const ids = projection.rows.map((row) => row.requirementId);
  assert.equal(projection.requirementCount, 2003);
  assert.equal(new Set(ids).size, 2003);
  assert.equal(projection.positiveCoverage, 0);
  assert.ok(projection.rows.every((row) => row.requirementId && row.opportunityId && row.provenancePreserved));
  assert.ok(projection.rows.every((row) => ["UNRESOLVED", "SPECIALIST_BLOCKED", "SCOPE_BLOCKED"].includes(row.state)));
});

test("directness, scope, specialist, and unresolved states remain distinct", () => {
  const capabilities = [
    { capabilityId: "cap-direct", canonicalName: "TECHNICAL_PROGRAM_LEADERSHIP", specialistClassification: "GENERAL", authorityState: "VERIFIED_DIRECT", scope: "LED_PROGRAM" },
    { capabilityId: "cap-transfer", canonicalName: "TECHNICAL_PROGRAM_LEADERSHIP", specialistClassification: "GENERAL", authorityState: "VERIFIED_TRANSFERABLE", scope: "LED_PROGRAM" },
    { capabilityId: "cap-partial", canonicalName: "TECHNICAL_PROGRAM_LEADERSHIP", specialistClassification: "GENERAL", authorityState: "PARTIALLY_SUPPORTED", scope: "LED_PROGRAM" },
  ];
  const concepts = [
    { conceptId: "concept-direct", capabilityFamily: "PROGRAM_DELIVERY", scope: "LED_PROGRAM", specialistClassification: "GENERAL", targetCount: 1 },
    { conceptId: "concept-specialist", capabilityFamily: "PROGRAM_DELIVERY", scope: "LED_PROGRAM", specialistClassification: "SPECIALIST", targetCount: 1 },
    { conceptId: "concept-scope", capabilityFamily: "PROGRAM_DELIVERY", scope: "PORTFOLIO_ENTERPRISE", specialistClassification: "GENERAL", targetCount: 1 },
  ];
  const result = projectCapabilityRequirementRelationships({ capabilities, concepts });
  assert.equal(result.counts.DIRECT, 1);
  assert.equal(result.counts.SPECIALIST_BLOCKED, 1);
  assert.equal(result.counts.SCOPE_BLOCKED, 1);
  assert.equal(result.specialistLeakage, 0);
  assert.equal(result.scopeViolations, 0);
});

test("unresolved authority does not become negative capability evidence", () => {
  const result = projectCapabilityRequirementRelationships({
    capabilities: [{ capabilityId: "cap-unresolved", canonicalName: "TECHNICAL_PROGRAM_LEADERSHIP", specialistClassification: "GENERAL", authorityState: "KEEP_UNRESOLVED", scope: "LED_PROGRAM" }],
    concepts: [{ conceptId: "concept", capabilityFamily: "PROGRAM_DELIVERY", scope: "LED_PROGRAM", specialistClassification: "GENERAL", targetCount: 3 }],
  });
  assert.equal(result.counts.UNRESOLVED, 3);
  assert.equal(result.counts.DIRECT, 0);
  assert.equal(result.counts.TRANSFERABLE, 0);
  assert.equal(result.counts.PARTIAL, 0);
});
