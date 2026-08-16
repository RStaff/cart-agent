import assert from "node:assert/strict";
import test from "node:test";
import { buildConflictClearanceIndex, projectConflictClearanceMappings } from "./careerOsConflictClearanceProjection.mjs";

const candidate = (overrides = {}) => ({ candidateId: "candidate-1", sourceFactId: "fact-1", conflictState: "CONFLICTING", conflictReason: "UNRESOLVED_VERIFICATION", eligibilityState: "CONFLICT_BLOCKED", ...overrides });
const decision = (answer, candidateIds = ["candidate-1"]) => ({ questionId: `question-${answer}`, decisionId: `decision-${answer}`, answer, propagationEligibleCandidateIds: candidateIds });

test("exact conflict decisions preserve direct, transferable, and partial semantics", () => {
  const direct = buildConflictClearanceIndex({ candidates: [candidate()], decisions: [decision("DIRECT")] });
  assert.equal(direct.byCandidateId.get("candidate-1").classification, "SAFELY_CLEARED_DIRECT");
  const transferable = buildConflictClearanceIndex({ candidates: [candidate()], decisions: [decision("TRANSFERABLE")] });
  assert.equal(transferable.byCandidateId.get("candidate-1").classification, "SAFELY_CLEARED_TRANSFERABLE");
  const partial = buildConflictClearanceIndex({ candidates: [candidate()], decisions: [decision("DIRECT"), decision("ADJACENT")] });
  assert.equal(partial.byCandidateId.get("candidate-1").classification, "SAFELY_CLEARED_PARTIAL");
});

test("keep unresolved, specialist, and temporal boundaries do not clear", () => {
  const unresolved = buildConflictClearanceIndex({ candidates: [candidate()], decisions: [decision("KEEP_UNRESOLVED")] });
  assert.equal(unresolved.byCandidateId.get("candidate-1").classification, "KEEP_UNRESOLVED");
  const specialist = buildConflictClearanceIndex({ candidates: [candidate({ conflictReason: "SPECIALIST_DOMAIN_CONFLICT" })], decisions: [decision("DIRECT")] });
  assert.equal(specialist.byCandidateId.get("candidate-1").classification, "STILL_CONFLICT_BLOCKED");
  const temporal = buildConflictClearanceIndex({ candidates: [candidate({ conflictReason: "TEMPORAL_CONFLICT" })], decisions: [decision("DIRECT")] });
  assert.equal(temporal.byCandidateId.get("candidate-1").classification, "STILL_CONFLICT_BLOCKED");
});

test("projection is bounded to exact source-fact references and does not mutate input", () => {
  const mapping = { requirementId: "req-1", careerFactIds: ["fact-1"], classification: "UNKNOWN", explanation: "unknown" };
  const input = JSON.stringify(mapping);
  const index = buildConflictClearanceIndex({ candidates: [candidate()], decisions: [decision("DIRECT")] });
  const result = projectConflictClearanceMappings({ mappings: [mapping], index });
  assert.equal(result.mappings[0].classification, "PROVEN");
  assert.equal(result.mappings[0].operatorConflictResolution.offlineOnly, true);
  assert.equal(JSON.stringify(mapping), input);
});

test("generic cleared authority cannot satisfy specialist requirements", () => {
  const index = buildConflictClearanceIndex({ candidates: [candidate()], decisions: [decision("DIRECT")] });
  const result = projectConflictClearanceMappings({
    requirements: [{ id: "req-tax", requirementCategory: "MANDATORY_SPECIALIST", requirementText: "International tax compliance" }],
    mappings: [{ requirementId: "req-tax", careerFactIds: ["fact-1"], classification: "UNKNOWN" }],
    index,
  });
  assert.equal(result.mappings[0].classification, "UNKNOWN");
  assert.equal(result.stats.specialistBlocked, 1);
});
