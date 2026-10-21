import test from "node:test";
import assert from "node:assert/strict";
import { buildEvidenceRelationshipDiagnostics } from "./requirementCoverageDiagnostics.mjs";

const requirement = (conceptKey) => ({ conceptKey });
const capability = (capabilityKey, authorityState) => ({ capabilityKey, authorityState });
const relationship = (state, capabilityKey = null) => ({ state, ...(capabilityKey ? { capabilityKey } : {}) });

test("zero capability authority is distinguishable from zero requirements", () => {
  const diagnostics = buildEvidenceRelationshipDiagnostics({ requirements: [requirement("PROGRAM_DELIVERY")], capabilities: [], relationships: [relationship("UNKNOWN")] });
  assert.equal(diagnostics.capabilityAuthorityCount, 0);
  assert.equal(diagnostics.parsedRequirementCount, 1);
  assert.equal(diagnostics.requirementConceptKeysWithoutCapabilityCandidateCount, 1);
  assert.equal(diagnostics.relationshipsWithoutCapabilityCount, 1);
  assert.equal(diagnostics.unknownRelationshipCount, 1);
});

test("direct and transferable authority remain distinct in aggregate diagnostics", () => {
  const diagnostics = buildEvidenceRelationshipDiagnostics({
    requirements: [requirement("PROGRAM_DELIVERY"), requirement("TECHNOLOGY_IMPLEMENTATION")],
    capabilities: [capability("PROGRAM_DELIVERY", "VERIFIED_DIRECT"), capability("TECHNOLOGY_IMPLEMENTATION", "VERIFIED_TRANSFERABLE")],
    relationships: [relationship("DIRECT", "PROGRAM_DELIVERY"), relationship("TRANSFERABLE", "TECHNOLOGY_IMPLEMENTATION")],
  });
  assert.equal(diagnostics.directCapabilityAuthorityCount, 1);
  assert.equal(diagnostics.transferableCapabilityAuthorityCount, 1);
  assert.equal(diagnostics.directRelationshipCount, 1);
  assert.equal(diagnostics.transferableRelationshipCount, 1);
  assert.equal(diagnostics.fitNumeratorCount, 2);
  assert.equal(diagnostics.fitDenominatorCount, 2);
});

test("unmatched concepts remain unknown without inventing support", () => {
  const diagnostics = buildEvidenceRelationshipDiagnostics({
    requirements: [requirement("UNMATCHED_PROGRAM_CONCEPT"), requirement("SPECIALIST_CERTIFICATION")],
    capabilities: [capability("PROGRAM_DELIVERY", "NEEDS_MORE_EVIDENCE")],
    relationships: [relationship("UNKNOWN"), relationship("SPECIALIST_BLOCKED")],
  });
  assert.equal(diagnostics.capabilityAuthorityCount, 1);
  assert.equal(diagnostics.unresolvedCapabilityAuthorityCount, 1);
  assert.equal(diagnostics.requirementConceptKeysWithCapabilityCandidateCount, 0);
  assert.equal(diagnostics.requirementConceptKeysWithoutCapabilityCandidateCount, 2);
  assert.equal(diagnostics.unknownRelationshipCount, 1);
  assert.equal(diagnostics.specialistBlockedRelationshipCount, 1);
  assert.equal(diagnostics.fitNumeratorCount, 0);
});

test("multiple requirements produce deterministic aggregate counts", () => {
  const diagnostics = buildEvidenceRelationshipDiagnostics({
    requirements: [requirement("PROGRAM_DELIVERY"), requirement("PROGRAM_DELIVERY"), requirement(null)],
    capabilities: [capability("PROGRAM_DELIVERY", "PARTIALLY_SUPPORTED"), capability("OUTCOME_DELIVERY", "NOT_SUPPORTED")],
    relationships: [relationship("PARTIAL", "PROGRAM_DELIVERY"), relationship("PARTIAL", "PROGRAM_DELIVERY"), relationship("UNKNOWN")],
  });
  assert.equal(diagnostics.parsedRequirementCount, 3);
  assert.equal(diagnostics.requirementsWithConceptKeyCount, 2);
  assert.equal(diagnostics.uniqueRequirementConceptKeyCount, 1);
  assert.equal(diagnostics.capabilityConceptKeyCount, 2);
  assert.equal(diagnostics.uniqueCapabilityConceptKeyCount, 2);
  assert.equal(diagnostics.partialRelationshipCount, 2);
  assert.equal(diagnostics.relationshipEvaluationCount, 3);
});

test("diagnostics are aggregate-only and do not serialize source or customer text", () => {
  const privateText = "private career evidence and job description";
  const diagnostics = buildEvidenceRelationshipDiagnostics({
    requirements: [{ conceptKey: "PROGRAM_DELIVERY", text: privateText }],
    capabilities: [{ capabilityKey: "PROGRAM_DELIVERY", authorityState: "VERIFIED_DIRECT", statement: privateText, label: "Private label" }],
    relationships: [{ state: "DIRECT", text: privateText, capabilityKey: "PROGRAM_DELIVERY", explanation: privateText }],
  });
  const serialized = JSON.stringify(diagnostics);
  assert.doesNotMatch(serialized, /private career evidence|job description|Private label/);
  assert.equal(Object.prototype.hasOwnProperty.call(diagnostics, "text"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(diagnostics, "capabilityKey"), false);
});

test("diagnostics do not alter relationship results", () => {
  const relationships = [relationship("DIRECT", "PROGRAM_DELIVERY"), relationship("UNKNOWN")];
  const diagnostics = buildEvidenceRelationshipDiagnostics({ requirements: [requirement("PROGRAM_DELIVERY"), requirement("OTHER")], capabilities: [capability("PROGRAM_DELIVERY", "VERIFIED_DIRECT")], relationships });
  assert.deepEqual(relationships, [relationship("DIRECT", "PROGRAM_DELIVERY"), relationship("UNKNOWN")]);
  assert.equal(diagnostics.fitNumeratorCount, 1);
  assert.equal(diagnostics.fitDenominatorCount, 2);
});
