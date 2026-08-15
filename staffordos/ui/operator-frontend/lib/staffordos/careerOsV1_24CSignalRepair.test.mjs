import assert from "node:assert/strict";
import test from "node:test";
import { classifyRoleFunction, normalizeRequirements, repairAuthorityDiagnostics } from "./careerOsMatchAuthoritySignalRepairV1_24C.mjs";
import { run } from "./runCareerOsV1_24CSignalRepairEvaluation.mjs";

test("specialist role families are not established by generic operations or strategy vocabulary", () => {
  assert.equal(classifyRoleFunction({ title: "Global Payroll Manager" }).roleFamily, "PAYROLL");
  assert.equal(classifyRoleFunction({ title: "Director, US International Tax" }).roleFamily, "TAX");
  assert.equal(classifyRoleFunction({ title: "Director, Technical Program Management - Technical Solutions Operations" }).roleFamily, "TECHNICAL_PROGRAM");
  assert.equal(classifyRoleFunction({ title: "Strategy Operations Manager" }).roleFamily, "OTHER");
});

test("structural and generic responsibility text is unresolved, not positive evidence", () => {
  const diagnostics = repairAuthorityDiagnostics({ title: "Global Payroll Manager", authorityDiagnostics: { responsibilitySimilarity: { comparisons: [{ requirementId: "r1", requirement: "Key responsibilities", evidenceState: "STRONG_TRANSFERABLE_SUPPORT", comparisonReason: "existing mapping" }, { requirementId: "r2", requirement: "Manage payroll processing and compliance", evidenceState: "UNKNOWN", comparisonReason: "unresolved" }] }, seniorityCompatibility: { state: "UNRESOLVED", capabilityConclusion: "UNRESOLVED_CAPABILITY" }, domainCompatibility: { state: "UNRESOLVED_DOMAIN", capabilityConclusion: "UNRESOLVED_CAPABILITY" } } });
  assert.equal(diagnostics.responsibilitySimilarity.comparisons[0].evidenceState, "UNKNOWN");
  assert.equal(diagnostics.responsibilitySimilarity.comparisons[0].capabilityConclusion, "UNRESOLVED_CAPABILITY");
  assert.equal(diagnostics.responsibilitySimilarity.comparisons[1].evidenceState, "UNKNOWN");
});

test("transferable program responsibility remains positive and senior stretch remains non-blocking", () => {
  const diagnostics = repairAuthorityDiagnostics({ title: "Director, Technical Program Management", authorityDiagnostics: { responsibilitySimilarity: { comparisons: [{ requirementId: "r1", requirement: "Lead complex cross-functional programs and manage delivery", evidenceState: "STRONG_TRANSFERABLE_SUPPORT", comparisonReason: "existing mapping" }] }, seniorityCompatibility: { state: "UPWARD_STRETCH_WITH_SUPPORTED_SCOPE", capabilityConclusion: "NO_PROOF_OF_LEVEL_CAPABILITY_GAP" }, domainCompatibility: { state: "TRANSFERABLE_DOMAIN", capabilityConclusion: "TRANSFERABLE_CAPABILITY" } } });
  assert.equal(diagnostics.responsibilitySimilarity.counts.STRONG_TRANSFERABLE_SUPPORT, 1);
  assert.equal(diagnostics.seniorityCompatibility.state, "UPWARD_STRETCH_WITH_SUPPORTED_SCOPE");
  assert.equal(diagnostics.seniorityCompatibility.capabilityConclusion, "NO_PROOF_OF_LEVEL_CAPABILITY_GAP");
});

test("missing and unknown evidence remain distinct from proven capability gaps", () => {
  const normalized = normalizeRequirements([{ id: "r1", requirementCategory: "Required skill", requirementText: "Experience with payroll tax filings" }, { id: "r2", requirementCategory: "Responsibility", requirementText: "Lead cross-functional transformation programs" }]);
  assert.equal(normalized[0].taxonomy, "SPECIALIST_DOMAIN_REQUIREMENT");
  const diagnostics = repairAuthorityDiagnostics({ title: "AI Enablement Program Manager", authorityDiagnostics: { responsibilitySimilarity: { comparisons: [{ requirementId: "r1", requirement: "Lead cross-functional transformation programs", evidenceState: "UNKNOWN", comparisonReason: "unresolved" }, { requirementId: "r2", requirement: "Lead operating model", evidenceState: "NO_SUPPORTED_EVIDENCE", comparisonReason: "no mapped evidence" }] }, seniorityCompatibility: { state: "UNRESOLVED", capabilityConclusion: "UNRESOLVED_CAPABILITY" }, domainCompatibility: { state: "UNRESOLVED_DOMAIN", capabilityConclusion: "UNRESOLVED_CAPABILITY" } } });
  assert.equal(diagnostics.responsibilitySimilarity.comparisons[0].capabilityConclusion, "UNRESOLVED_CAPABILITY");
  assert.equal(diagnostics.responsibilitySimilarity.comparisons[1].capabilityConclusion, "UNRESOLVED_CAPABILITY");
});

test("Datadog control remains unboosted and labels are not consumed", () => {
  const result = run();
  assert.equal(result.datadog.sampleId, "H24-006");
  assert.equal(result.datadog.beforeRank, result.datadog.modelRank);
  assert.equal(result.datadog.review.selfConfidence, "LOW");
  assert.equal(result.lockedExperiment.repairRules.selfConfidenceConsumed, false);
});

test("authority repair rerun is deterministic", () => {
  const first = run();
  const second = run();
  assert.deepEqual(first.after, second.after);
  assert.deepEqual(first.deltas, second.deltas);
  assert.equal(first.lockedExperiment.calibrationLabelsHash, second.lockedExperiment.calibrationLabelsHash);
  assert.equal(first.lockedExperiment.holdoutLabelsHash, second.lockedExperiment.holdoutLabelsHash);
});
