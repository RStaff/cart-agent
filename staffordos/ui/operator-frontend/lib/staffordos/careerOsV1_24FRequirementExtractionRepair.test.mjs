import assert from "node:assert/strict";
import test from "node:test";
import { run, repairComparisons } from "./runCareerOsV1_24FRequirementExtractionRepair.mjs";

test("deduplication preserves lineage and does not merge distinct requirements", () => {
  const result = repairComparisons({ repairedComparisons: [
    { requirementId: "r1", requirement: "Lead cross-functional programs", evidenceState: "UNRESOLVED", careerEvidenceIds: [] },
    { requirementId: "r2", requirement: " lead   cross-functional programs ", evidenceState: "UNRESOLVED", careerEvidenceIds: [] },
    { requirementId: "r3", requirement: "Manage product backlog", evidenceState: "UNRESOLVED", careerEvidenceIds: [] },
  ] });
  assert.equal(result.duplicatesMerged, 1);
  assert.equal(result.comparisons.length, 2);
  assert.deepEqual(result.comparisons[0].sourceLineage, ["r1", "r2"]);
});

test("non-capability classifications are excluded without deleting source records", () => {
  const result = repairComparisons({ repairedComparisons: [
    { requirementId: "r1", requirement: "Benefits include health insurance", evidenceState: "UNRESOLVED", careerEvidenceIds: [] },
    { requirementId: "r2", requirement: "Salary range is $100,000", evidenceState: "UNRESOLVED", careerEvidenceIds: [] },
  ] });
  assert.equal(result.comparisons.length, 2);
  assert.equal(result.comparisons.filter((x) => !x.includedForCapability).length, 2);
});

test("frozen 80-role rerun preserves labels and V2D identity", () => {
  const first = run();
  const second = run();
  assert.deepEqual(first.after, second.after);
  assert.equal(first.baseline.v2dFormula, "FROZEN_V1_23_V2D");
  assert.deepEqual(first.baseline.v2dWeights, { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 });
  assert.equal(first.baseline.calibrationLabelHash, "18023e8a944331b3c938f62174f4ce60881c1c114298c73049bea6f26b135b85");
  assert.equal(first.baseline.holdoutLabelHash, "0d77e5b1ec98285c42cb0115ae9ec4be8bde2077d15740a58cbd0509314593e0");
});
