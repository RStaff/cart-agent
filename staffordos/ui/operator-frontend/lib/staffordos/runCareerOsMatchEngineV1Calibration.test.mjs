import assert from "node:assert/strict";
import test from "node:test";
import { WEIGHT_SETS } from "./runCareerOsMatchEngineV1Calibration.mjs";

test("calibration weight sets remain offline candidates and preserve V1", () => {
  assert.deepEqual(WEIGHT_SETS.EXPERIMENTAL_WEIGHT_SET_V1, {
    requiredSkillsFit: 35,
    relevantExperienceFit: 20,
    roleFunctionFit: 15,
    responsibilitySimilarity: 10,
    seniorityFit: 8,
    domainFit: 7,
    geographyWorkArrangementFit: 5,
    compensationFit: 0,
  });
  assert.notDeepEqual(WEIGHT_SETS.EXPERIMENTAL_WEIGHT_SET_V1, WEIGHT_SETS.EXPERIMENTAL_WEIGHT_SET_V1B);
});

test("candidate weights do not include self-confidence or workflow state", () => {
  for (const weights of Object.values(WEIGHT_SETS)) {
    assert.equal(Object.hasOwn(weights, "selfConfidence"), false);
    assert.equal(Object.hasOwn(weights, "workflowDecision"), false);
    assert.equal(Object.hasOwn(weights, "interest"), false);
    assert.equal(Object.hasOwn(weights, "wouldPursue"), false);
  }
});
