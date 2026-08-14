import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const metrics = JSON.parse(readFileSync("staffordos/job-search/CAREEROS_V1_23_MODEL_METRICS.json", "utf8"));
const evaluation = JSON.parse(readFileSync("staffordos/job-search/CAREEROS_V1_23_MODEL_EVALUATION_DATA.json", "utf8"));

test("V1 baseline is reproduced and candidate models use the same 40-record authority", () => {
  assert.equal(evaluation.datasetCount, 40);
  assert.equal(evaluation.reviewCount, 40);
  assert.equal(evaluation.baselineV1Reproduced, true);
  assert.equal(metrics.models.MODEL_V1.metrics.top10Precision, 0.2);
  assert.equal(metrics.models.MODEL_V1.metrics.viableRecall, 0.23);
});

test("candidate models preserve hard-blocker safety and do not use self-confidence", () => {
  for (const model of Object.values(metrics.models)) {
    assert.equal(model.metrics.hardMismatchLeakageTop10, 0);
  }
  assert.equal(evaluation.selfConfidenceExcluded, true);
  assert.equal(metrics.selfConfidenceSafety.usedInScore, false);
  assert.equal(metrics.selfConfidenceSafety.lowVsHighScoreChanges, 0);
});

test("transferability-aware candidates remain deterministic and selection follows the rule", () => {
  assert.equal(metrics.models.MODEL_V2D_ROBUSTNESS_CONTROL.robustness.classification, "ROBUST");
  assert.equal(metrics.models.MODEL_V2D_ROBUSTNESS_CONTROL.metrics.top10Precision, 0.3);
  assert.equal(metrics.models.MODEL_V2D_ROBUSTNESS_CONTROL.metrics.viableRecall, 0.23);
  assert.equal(metrics.selectedModel, "MODEL_V2D_ROBUSTNESS_CONTROL");
});
