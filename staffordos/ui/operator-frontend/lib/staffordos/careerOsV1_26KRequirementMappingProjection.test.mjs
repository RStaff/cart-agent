import test from "node:test";
import assert from "node:assert/strict";
import { projectRequirementMappingAuthority } from "./careerOsV1_26KRequirementMappingProjection.mjs";

const requirement = (id, text = "Coordinate a technical program") => ({ id, jobOpportunityId: "job-1", requirementText: text });
const decision = (state, requirementId = "req-1", extra = {}) => ({ decisionId: `d-${state}`, requirementId, opportunityId: "job-1", state, candidateCareerFactIds: ["fact-1"], candidateCareerEvidenceIds: ["evidence-1"], operatorId: "ROSS", specialistCompatible: false, createdAt: "2026-08-16T00:00:00Z", ...extra });
const mapping = (id = "req-1") => ({ requirementId: id, classification: "UNKNOWN", careerFactIds: ["fact-1"], careerEvidenceIds: ["evidence-1"] });

test("preserves direct, transferable, and partial as distinct exact mappings", () => {
  const result = projectRequirementMappingAuthority({ requirements: [requirement("req-1"), requirement("req-2"), requirement("req-3")], mappings: [mapping("req-1"), mapping("req-2"), mapping("req-3")], decisions: [decision("DIRECT", "req-1"), decision("TRANSFERABLE", "req-2"), decision("PARTIAL", "req-3")], factIds: new Set(["fact-1"]), evidenceIds: new Set(["evidence-1"]) });
  assert.deepEqual(result.mappings.map((x) => x.classification), ["PROVEN", "TRANSFERABLE", "PARTIAL"]);
});

test("neutral and bounded negative states do not create positive or global negative evidence", () => {
  const result = projectRequirementMappingAuthority({ requirements: [requirement("req-1"), requirement("req-2"), requirement("req-3")], mappings: [mapping("req-1"), mapping("req-2"), mapping("req-3")], decisions: [decision("NO_SUPPORTED_EQUIVALENT", "req-1"), decision("NEEDS_MORE_EVIDENCE", "req-2"), decision("KEEP_UNRESOLVED", "req-3")], factIds: new Set(["fact-1"]), evidenceIds: new Set(["evidence-1"]) });
  assert.deepEqual(result.mappings.map((x) => x.classification), ["UNKNOWN", "UNKNOWN", "UNKNOWN"]);
  assert.equal(result.stats.noSupportedEquivalent, 1); assert.equal(result.stats.neutralUnresolved, 2);
});

test("specialist positive mapping fails closed without explicit specialist compatibility", () => {
  const result = projectRequirementMappingAuthority({ requirements: [requirement("req-1", "Build production software engineering systems")], mappings: [mapping()], decisions: [decision("TRANSFERABLE")], factIds: new Set(["fact-1"]), evidenceIds: new Set(["evidence-1"]) });
  assert.equal(result.mappings[0].classification, "UNKNOWN"); assert.equal(result.stats.blockedSpecialist, 1);
});

test("missing authority, wrong identity, and unsupported mode do not infer mappings", () => {
  const source = [mapping("req-1"), mapping("req-2")];
  const result = projectRequirementMappingAuthority({ requirements: [requirement("req-1")], mappings: source, decisions: [decision("TRANSFERABLE", "req-1"), decision("DIRECT", "req-2")], factIds: new Set(), evidenceIds: new Set(), mode: "DIRECT_ONLY" });
  assert.deepEqual(result.mappings, source); assert.equal(result.stats.blockedProvenance, 1); assert.equal(result.stats.notMapped, 1);
});

test("does not mutate source arrays or mappings", () => {
  const source = [mapping()]; const before = JSON.stringify(source);
  projectRequirementMappingAuthority({ requirements: [requirement("req-1")], mappings: source, decisions: [decision("DIRECT")], factIds: new Set(["fact-1"]), evidenceIds: new Set(["evidence-1"]) });
  assert.equal(JSON.stringify(source), before);
});
