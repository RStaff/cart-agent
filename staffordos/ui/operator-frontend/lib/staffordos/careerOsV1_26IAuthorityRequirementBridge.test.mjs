import assert from "node:assert/strict";
import test from "node:test";
import { applyAuthorityRequirementBridge, buildAuthorityRequirementBridge } from "./careerOsV1_26IAuthorityRequirementBridge.mjs";

const candidate = { candidateId: "candidate_1", sourceFactId: "fact_1", conflictState: "CLEARED", eligibilityState: "CLEARED" };
const requirement = { id: "requirement_1", requirementCategory: "RESPONSIBILITY", requirementText: "Coordinate a cross-functional technical program" };
const provenance = { bridgeId: "bridge_1", candidateId: "candidate_1", requirementId: "requirement_1", operatorDecisionId: "decision_1", conflictDecisionId: "conflict_1", operatorOutcome: "VERIFIED_TRANSFERABLE", relationship: "TRANSFERABLE", semanticBoundary: "Program delivery capability transfers to technically complex cross-functional coordination; no direct implementation claim.", provenanceReason: "Exact candidate and requirement authorities supplied by the governed offline fixture.", specialistCompatible: false };

test("bridge preserves exact IDs and distinct transferable state", () => {
  const bridge = buildAuthorityRequirementBridge({ candidates: [candidate], requirements: [requirement], records: [provenance] });
  assert.equal(bridge.counts.transferable, 1);
  assert.equal(bridge.accepted[0].candidateId, "candidate_1");
  assert.equal(bridge.accepted[0].requirementId, "requirement_1");
  assert.equal(applyAuthorityRequirementBridge({ mappings: [{ requirementId: "requirement_1", classification: "UNKNOWN" }], bridge: bridge.accepted }).mappings[0].classification, "TRANSFERABLE");
});

test("partial remains bounded and direct requires direct outcome", () => {
  const partial = buildAuthorityRequirementBridge({ candidates: [candidate], requirements: [requirement], records: [{ ...provenance, relationship: "PARTIAL", operatorOutcome: "PARTIALLY_SUPPORTED", unresolvedPortion: "People-management scope remains unresolved." }] });
  assert.equal(partial.counts.partial, 1);
  const invalidDirect = buildAuthorityRequirementBridge({ candidates: [candidate], requirements: [requirement], records: [{ ...provenance, relationship: "DIRECT", operatorOutcome: "VERIFIED_TRANSFERABLE" }] });
  assert.equal(invalidDirect.counts.accepted, 0);
  assert.equal(invalidDirect.rejected[0].reason, "DIRECT_OUTCOME_MISMATCH");
});

test("specialist firewall, title/keyword/domain inference, and missing authority fail closed", () => {
  const specialist = { id: "requirement_1", requirementCategory: "SPECIALIST", requirementText: "Lead payroll compliance" };
  const base = { ...provenance, specialistCompatible: false };
  const blocked = buildAuthorityRequirementBridge({ candidates: [candidate], requirements: [specialist], records: [base] });
  assert.equal(blocked.rejected[0].reason, "SPECIALIST_FIREWALL");
  const unsafe = buildAuthorityRequirementBridge({ candidates: [candidate], requirements: [requirement], records: [{ ...provenance, titleOnly: true }] });
  assert.equal(unsafe.rejected[0].reason, "UNSAFE_INFERENCE_SOURCE");
  const incomplete = buildAuthorityRequirementBridge({ candidates: [candidate], requirements: [requirement], records: [{ ...provenance, semanticBoundary: "" }] });
  assert.equal(incomplete.rejected[0].reason, "MISSING_SEMANTIC_BOUNDARY");
});

test("unknown and missing mappings remain unchanged and bridge is derived", () => {
  const mappings = [{ requirementId: "requirement_2", classification: "UNKNOWN" }, { requirementId: "requirement_3", classification: "MISSING" }];
  const result = applyAuthorityRequirementBridge({ mappings, bridge: [] });
  assert.deepEqual(result.mappings, mappings);
  assert.equal(result.affected, 0);
});
