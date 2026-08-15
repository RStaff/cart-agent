import assert from "node:assert/strict";
import test from "node:test";
import { repairRequirementEvidenceMappings, STATES } from "./careerOsV1_24DRequirementEvidenceRepair.mjs";
import { run, scoreV2D } from "./runCareerOsV1_24DRequirementEvidenceEvaluation.mjs";

const evidence = new Map([
  ["program", { title: "Program delivery", summary: "Led cross-functional programs and coordinated stakeholders", factText: "Owned complex initiatives and operating model execution" }],
  ["generic", { title: "Operations leadership", summary: "Managed teams and operations", factText: "Led business operations" }],
  ["finance", { title: "Finance evidence", summary: "Managed payroll tax reconciliation", factText: "Performed payroll and tax compliance" }],
]);

test("semantic program wording receives transferable, not exact, support", () => {
  const [result] = repairRequirementEvidenceMappings([{ requirement: "Lead cross-functional delivery programs", evidenceState: "UNKNOWN", careerEvidenceIds: ["program"] }], evidence);
  assert.equal(result.evidenceState, STATES.TRANSFERABLE);
  assert.equal(result.capabilityConclusion, "TRANSFERABLE_CAPABILITY");
});

test("existing exact support remains exact and is never inferred from wording", () => {
  const [result] = repairRequirementEvidenceMappings([{ requirement: "Lead cross-functional delivery programs", evidenceState: "EXACT_OR_DIRECT_SUPPORT", careerEvidenceIds: ["program"] }], evidence);
  assert.equal(result.evidenceState, STATES.PROVEN);
  assert.equal(result.originalEvidenceState, "EXACT_OR_DIRECT_SUPPORT");
});

test("generic management evidence does not satisfy specialist finance, tax, payroll, AV, software, or data requirements", () => {
  for (const requirement of ["Manage payroll tax compliance", "Produce AV media broadcasts", "Develop software in Python", "Build statistical data science models"]) {
    const [result] = repairRequirementEvidenceMappings([{ requirement, evidenceState: "UNKNOWN", careerEvidenceIds: ["generic"] }], evidence);
    assert.equal(result.evidenceState, STATES.UNKNOWN, requirement);
    assert.equal(result.capabilityConclusion, "UNRESOLVED_CAPABILITY");
  }
});

test("matching specialist evidence remains transferable without becoming exact", () => {
  const [result] = repairRequirementEvidenceMappings([{ requirement: "Manage payroll tax compliance", evidenceState: "UNKNOWN", careerEvidenceIds: ["finance"] }], evidence);
  assert.equal(result.evidenceState, STATES.TRANSFERABLE);
});

test("missing linkage remains unresolved and is not a capability gap", () => {
  const [result] = repairRequirementEvidenceMappings([{ requirement: "Lead a regulated clinical program", evidenceState: "MISSING", careerEvidenceIds: [] }], evidence);
  assert.equal(result.evidenceState, STATES.NONE);
  assert.equal(result.capabilityConclusion, "UNRESOLVED_CAPABILITY");
});

test("frozen score excludes self-confidence, interest, and workflow inputs", () => {
  const features = { relevantExperience: 80, roleFunction: 70, responsibility: 75, seniority: 60 };
  assert.equal(scoreV2D(features), scoreV2D({ ...features, selfConfidence: "LOW", interest: "NONE", wouldPursue: "NO", workflowDecision: "SKIP" }));
});

test("offline repair is deterministic and preserves label hashes", () => {
  const first = run();
  const second = run();
  assert.deepEqual(first.after, second.after);
  assert.deepEqual(first.linkageCoverage, second.linkageCoverage);
  assert.equal(first.lockedExperiment.calibrationLabelsHash, "18023e8a944331b3c938f62174f4ce60881c1c114298c73049bea6f26b135b85");
  assert.equal(first.lockedExperiment.holdoutLabelsHash, "0d77e5b1ec98285c42cb0115ae9ec4be8bde2077d15740a58cbd0509314593e0");
});
