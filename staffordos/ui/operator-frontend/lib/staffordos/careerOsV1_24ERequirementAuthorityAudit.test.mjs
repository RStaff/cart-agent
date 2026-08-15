import assert from "node:assert/strict";
import test from "node:test";
import { classify, importance, run } from "./runCareerOsV1_24ERequirementAuthorityAudit.mjs";

test("specialist and general responsibility requirements remain distinct", () => {
  assert.equal(classify("Expertise in international tax compliance is required"), "MANDATORY_SPECIALIST");
  assert.equal(classify("Lead cross-functional programs"), "CORE_RESPONSIBILITY");
  assert.equal(importance("Expertise in international tax compliance is required", "MANDATORY_SPECIALIST"), "HARD_REQUIREMENT");
});

test("preferred wording does not become a hard requirement solely because it is specialist", () => {
  assert.equal(importance("Payroll experience is preferred", "MANDATORY_SPECIALIST"), "PREFERRED");
});

test("non-capability text cannot become capability evidence", () => {
  for (const text of ["Benefits include health insurance and paid time off", "Work remotely from the United States", "Salary range is $100,000-$120,000", "About the role"]) {
    const cls = classify(text);
    assert.ok(["BENEFITS_OR_EMPLOYER_MARKETING", "LOCATION_OR_WORK_ARRANGEMENT", "COMPENSATION", "STRUCTURAL_OR_HEADING"].includes(cls), cls);
    assert.equal(importance(text, cls), "NON_CAPABILITY");
  }
});

test("audit preserves frozen labels, counts, and deterministic output", () => {
  const first = run();
  const second = run();
  assert.deepEqual(first.classificationDistribution, second.classificationDistribution);
  assert.deepEqual(first.coverage, second.coverage);
  assert.equal(first.inventory.opportunities, 80);
  assert.equal(first.inventory.calibration, 40);
  assert.equal(first.inventory.holdout, 40);
  assert.equal(first.baseline.calibrationLabelHash, "18023e8a944331b3c938f62174f4ce60881c1c114298c73049bea6f26b135b85");
  assert.equal(first.baseline.holdoutLabelHash, "0d77e5b1ec98285c42cb0115ae9ec4be8bde2077d15740a58cbd0509314593e0");
});

test("audit retains source requirement identity and does not create evidence", () => {
  const result = run();
  assert.equal(result.extractionDefects.provenancePreserved, true);
  assert.ok(result.rows.every((row) => row.requirements.every((requirement) => requirement.requirementId && requirement.careerEvidenceReferenceCount >= 0)));
});
