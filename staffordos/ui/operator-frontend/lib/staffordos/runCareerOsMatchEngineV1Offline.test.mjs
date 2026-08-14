import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const runner = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runCareerOsMatchEngineV1Offline.mjs");
const preferenceFile = path.join(process.env.HOME, ".staffordos/private/professional/job-search/job-search-preferences/job_search_preferences.json");

test("offline evaluator reads explicit canonical preference authority and preserves missing-authority UNKNOWN", async () => {
  const module = await import(`file://${runner}`);
  const explicit = module.loadPreferenceAuthority();
  assert.equal(explicit.preferences.authority, "ROSS_OPERATOR_EXPLICIT");
  assert.equal(explicit.preferences.geography.resolution, "EXPLICIT");
  const missing = module.loadPreferenceAuthority(mkdtempSync(path.join(tmpdir(), "careeros-offline-preferences-")));
  assert.equal(missing.preferences.authority, "AWAITING_ROSS_CONFIRMATION");
  assert.equal(missing.preferences.geography.resolution, "UNRESOLVED");
});

test("offline evaluator reruns deterministically without mutating preference authority", () => {
  assert.equal(existsSync(preferenceFile), true);
  const before = readFileSync(preferenceFile, "utf8");
  return import(`file://${runner}`).then((module) => {
    const first = module.buildEvaluation();
    const second = module.buildEvaluation();
    assert.equal(first.records.length, 40);
    assert.equal(JSON.stringify(first.records), JSON.stringify(second.records));
    assert.equal(first.runtimeSource.preferenceCompatibilityActive, true);
    assert.deepEqual(first.preferenceCompatibilityDistribution, second.preferenceCompatibilityDistribution);
  }).finally(() => {
  assert.equal(readFileSync(preferenceFile, "utf8"), before);
  });
});

test("offline result keeps hard mismatch eligibility separate from preference compatibility", () => {
  const evaluation = JSON.parse(readFileSync(path.join(root, "staffordos/job-search/CAREEROS_MATCH_ENGINE_V1_EVALUATION_DATA.json"), "utf8"));
  const hardMismatch = evaluation.records.find((record) => record.existingJ010State === "HARD_MISMATCH");
  assert.equal(hardMismatch.eligibility, "INELIGIBLE");
  assert.equal(typeof hardMismatch.preferenceCompatibility, "string");
  assert.equal(evaluation.controlCases[0].caseId, "CONTROL_CASE_DATADOG_TPM");
});
