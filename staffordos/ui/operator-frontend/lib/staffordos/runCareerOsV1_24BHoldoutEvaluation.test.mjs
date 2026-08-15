import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { run, scoreFrozenV2D, V2D_WEIGHTS } from "./runCareerOsV1_24BHoldoutEvaluation.mjs";

const manifest = JSON.parse(readFileSync("staffordos/job-search/CAREEROS_V1_24_EVALUATION_DATA.json", "utf8"));
const holdoutLabelsPath = `${process.env.HOME}/.staffordos/private/professional/job-search/match-engine-calibration/holdout_human_labels.json`;
const holdoutLabelsBefore = readFileSync(holdoutLabelsPath, "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex");

test("holdout has 40 complete labels and remains disjoint from calibration", () => {
  assert.equal(manifest.holdoutSet.length, 40);
  assert.equal(new Set(manifest.holdoutSet.map((x) => x.opportunityId)).size, 40);
  assert.equal(new Set(manifest.holdoutSet.map((x) => x.sampleId)).size, 40);
  assert.equal(new Set(manifest.calibrationSet.map((x) => x.opportunityId)).size, 40);
  assert.equal(new Set(manifest.holdoutSet.map((x) => x.opportunityId)).intersection(new Set(manifest.calibrationSet.map((x) => x.opportunityId))).size, 0);
});

test("frozen V2D weights and formula are unchanged", () => {
  assert.deepEqual(V2D_WEIGHTS, { requiredSkills: 0, relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10, domain: 0, evidenceCoverage: 0 });
  assert.equal(manifest.modelSelectionFrozen.model, "MODEL_V2D_ROBUSTNESS_CONTROL");
  assert.equal(manifest.modelSelectionFrozen.formulaUnchanged, true);
  assert.deepEqual([...new Set(manifest.holdoutSet.map((x) => x.v2d.formula))], ["FROZEN_V1_23_V2D"]);
});

test("holdout evaluation is deterministic and does not mutate labels", () => {
  const first = run();
  const second = run();
  assert.deepEqual(first.rows, second.rows);
  assert.equal(hash(readFileSync(holdoutLabelsPath, "utf8")), hash(holdoutLabelsBefore));
  assert.equal(first.rows.length, 40);
  assert.equal(first.metrics.hardMismatchLeakageTop10, 0);
});

test("capability fit ignores interest, pursuit, self-confidence, and workflow dimensions", () => {
  const features = { relevantExperience: 70, roleFunction: 70, responsibility: 75, seniority: 80 };
  assert.equal(scoreFrozenV2D(features), scoreFrozenV2D({ ...features, interest: "NONE", wouldPursue: "NO", selfConfidence: "LOW", workflowDecision: "SKIP" }));
});

test("unknown diagnostics remain unresolved rather than negative capability evidence", () => {
  const result = run();
  const unknown = result.rows.find((row) => row.features.responsibility === null);
  assert.ok(unknown);
  assert.equal(unknown.features.responsibility, null);
  assert.notEqual(unknown.capabilityConclusion, "PROVEN_CAPABILITY_GAP");
});
