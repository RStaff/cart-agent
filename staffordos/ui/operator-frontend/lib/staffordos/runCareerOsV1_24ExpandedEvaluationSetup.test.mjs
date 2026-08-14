import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const evaluation = JSON.parse(readFileSync("staffordos/job-search/CAREEROS_V1_24_EVALUATION_DATA.json", "utf8"));

test("V1.24 preserves the locked 40-role calibration set and creates a separate holdout", () => {
  assert.equal(evaluation.calibrationSetCount, 40);
  assert.equal(evaluation.holdoutSetCount, 40);
  assert.equal(evaluation.holdoutHumanReviewComplete, 0);
  assert.equal(evaluation.modelSelectionFrozen.model, "MODEL_V2D_ROBUSTNESS_CONTROL");
  const calibrationIds = new Set(evaluation.calibrationSet.map((row) => row.opportunityId));
  assert.equal(evaluation.holdoutSet.some((row) => calibrationIds.has(row.opportunityId)), false);
});

test("new holdout records use neutral human-review state and preserve source decisions as baselines", () => {
  for (const row of evaluation.holdoutSet) {
    assert.equal(row.humanReview.status, "PENDING_OPERATOR_REVIEW");
    assert.equal(row.humanReview.evidenceFit, null);
    assert.equal(row.humanReview.selfConfidence, null);
    assert.equal(row.v2d.formula, "FROZEN_V1_23_V2D");
    assert.equal(row.v2d.score, null);
  }
});

test("holdout manifest contains multiple required role-family strata", () => {
  const families = new Set(evaluation.holdoutSet.map((row) => row.roleFamily));
  for (const family of ["AI_AUTOMATION_AGENT", "TECHNICAL_PROGRAM_PROJECT_PRODUCT", "MARTECH_MARKETING_OPERATIONS", "BUSINESS_SYSTEMS_ANALYST", "TRANSFORMATION_SOLUTIONS", "SENIOR_LEADERSHIP_STRETCH", "OBVIOUS_POOR_FIT_CONTROL"]) assert.equal(families.has(family), true);
});
