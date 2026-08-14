import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const result = JSON.parse(readFileSync("staffordos/job-search/CAREEROS_V1_22F_RECALIBRATION_DATA.json", "utf8"));

test("V1.22F freezes the 40-record human-label experiment", () => {
  assert.equal(result.experimentFreeze.datasetCount, 40);
  assert.equal(result.experimentFreeze.reviewCount, 40);
  assert.equal(result.experimentFreeze.sameSampleIds, true);
  assert.equal(result.experimentFreeze.sameLabels, true);
  assert.equal(result.experimentFreeze.fitFormulaUnchanged, true);
  assert.equal(result.experimentFreeze.weightsUnchanged, true);
});

test("repaired-authority recalibration is deterministic and apples-to-apples", () => {
  assert.deepEqual(result.baselineMetrics.weightSet, {
    requiredSkillsFit: 35,
    relevantExperienceFit: 20,
    roleFunctionFit: 15,
    responsibilitySimilarity: 10,
    seniorityFit: 8,
    domainFit: 7,
    geographyWorkArrangementFit: 5,
    compensationFit: 0,
  });
  assert.deepEqual(result.metricDeltas, {
    top5Precision: 0,
    top10Precision: 0,
    top5Agreement: 0,
    top10Agreement: 0,
    strongRecall: 0,
    strongGoodRecall: 0,
    viableRecall: 0,
    falsePositiveRate: 0,
    falseNegativeRate: 0,
    rankCorrelation: 0,
    hardMismatchLeakageTop10: 0,
    poorMatchLeakageTop10: 0,
    underRankedViable: 0,
  });
});

test("authority repair changes independent preference truth without changing fit ordering", () => {
  assert.deepEqual(result.authorityImpact.preference, { OUTSIDE_PREFERENCE: 27, UNKNOWN: 13 });
  assert.equal(result.selfConfidenceIsolation.usedInScoring, undefined);
  assert.equal(result.selfConfidenceIsolation.usedInScore, false);
  assert.equal(result.experimentFreeze.selfConfidenceUsedForScoring, false);
  assert.equal(result.rows.length, 40);
  assert.equal(result.rows.filter((row) => row.evidenceFit === "HARD_NO").length, 5);
});
