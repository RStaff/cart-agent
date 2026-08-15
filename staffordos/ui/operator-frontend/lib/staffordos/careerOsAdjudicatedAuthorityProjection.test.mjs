import assert from "node:assert/strict";
import test from "node:test";
import { buildAdjudicatedProjectionIndex, projectAdjudicatedMappings } from "./careerOsAdjudicatedAuthorityProjection.mjs";

function candidate(overrides = {}) {
  return { candidateId: "candidate_1", sourceFactId: "fact_1", conflictState: "UNKNOWN", eligibilityState: "OPERATOR_REVIEW_REQUIRED", conflictReason: null, eligibilityReasons: [], ...overrides };
}
function cluster(answer, candidateId = "candidate_1") {
  return { clusterId: `cluster_${answer}`, operatorAnswer: answer, propagationEligibleCandidateIds: [candidateId] };
}
function mapping(overrides = {}) { return { requirementId: "requirement_1", careerFactIds: ["fact_1"], classification: "UNKNOWN", explanation: "unresolved", ...overrides }; }

test("DIRECT and TRANSFERABLE project only through exact fact linkage and remain distinct", () => {
  const direct = buildAdjudicatedProjectionIndex({ candidates: [candidate()], highValueClusters: [cluster("DIRECT")] });
  const transfer = buildAdjudicatedProjectionIndex({ candidates: [candidate()], highValueClusters: [cluster("TRANSFERABLE")] });
  assert.equal(projectAdjudicatedMappings({ mappings: [mapping()], index: direct }).mappings[0].classification, "PROVEN");
  assert.equal(projectAdjudicatedMappings({ mappings: [mapping()], index: transfer }).mappings[0].classification, "TRANSFERABLE");
});

test("KEEP_UNRESOLVED and conflict-blocked candidates never add positive support", () => {
  const unresolved = buildAdjudicatedProjectionIndex({ candidates: [candidate()], highValueClusters: [cluster("KEEP_UNRESOLVED")] });
  assert.equal(projectAdjudicatedMappings({ mappings: [mapping()], index: unresolved }).mappings[0].classification, "UNKNOWN");
  const blocked = buildAdjudicatedProjectionIndex({ candidates: [candidate({ conflictState: "CONFLICTING", eligibilityState: "CONFLICT_BLOCKED", conflictReason: "SCOPE_CONFLICT" })], highValueClusters: [cluster("DIRECT")] });
  const result = projectAdjudicatedMappings({ mappings: [mapping()], index: blocked });
  assert.equal(result.mappings[0].classification, "UNKNOWN");
  assert.equal(result.stats.blockedPropagations, 1);
});

test("existing positive mappings and unmatched facts remain unchanged", () => {
  const index = buildAdjudicatedProjectionIndex({ candidates: [candidate()], highValueClusters: [cluster("DIRECT")] });
  const result = projectAdjudicatedMappings({ mappings: [mapping({ classification: "TRANSFERABLE" }), mapping({ requirementId: "requirement_2", careerFactIds: ["other_fact"] })], index });
  assert.equal(result.stats.comparisonsAffected, 0);
  assert.equal(result.mappings[0].classification, "TRANSFERABLE");
  assert.equal(result.mappings[1].classification, "UNKNOWN");
});
