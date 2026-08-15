import assert from "node:assert/strict";
import test from "node:test";
import { run } from "./runCareerOsV1_26EAuthorityProjectionEvaluation.mjs";

test("V1.26E consumes only safe adjudication intersections and preserves frozen rankings", () => {
  const result = run();
  assert.equal(result.projectionData.operatorAuthority.decisions, 16);
  assert.equal(result.projectionData.operatorAuthority.addressedDistinctCandidates, 203);
  assert.equal(result.projectionData.operatorAuthority.unsafePropagationDetected, false);
  assert.equal(result.projectionData.calibrationProjection.comparisonsAffected, 0);
  assert.equal(result.projectionData.holdoutProjection.comparisonsAffected, 0);
  assert.ok(result.projectionData.calibrationProjection.blockedPropagations > 0);
  assert.equal(result.projectionData.mutationGuards.careerFactMutated, false);
  assert.equal(result.projectionData.mutationGuards.careerEvidenceCreated, false);
  assert.equal(result.projectionData.mutationGuards.qualificationChanged, 0);
  assert.equal(result.projectionData.mutationGuards.eligibilityChanged, 0);
  assert.equal(result.metricsResult.calibration.comparison.rankChanges, 0);
  assert.equal(result.metricsResult.holdout.comparison.rankChanges, 0);
  assert.equal(result.metricsResult.deterministic.calibration, true);
  assert.equal(result.metricsResult.deterministic.holdout, true);
});
