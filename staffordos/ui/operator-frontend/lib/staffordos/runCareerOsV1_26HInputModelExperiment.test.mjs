import assert from "node:assert/strict";
import test from "node:test";
import { run } from "./runCareerOsV1_26HInputModelExperiment.mjs";

test("V1.26H uses frozen V2D and keeps candidate representations bounded", () => {
  const result = run();
  assert.deepEqual(result.frozenModel.weights, { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 });
  assert.equal(result.frozenModel.formula, "FROZEN_V1_23_V2D");
  assert.equal(result.authority.activeConflictQuestions, 16);
  assert.equal(result.isolation.selfConfidence, false);
  assert.equal(result.isolation.careerFactMutated, false);
  assert.equal(result.isolation.careerEvidenceMutated, false);
});
