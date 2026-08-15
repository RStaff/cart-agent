import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const manifestPath = path.join(root, "staffordos/job-search/CAREEROS_V1_24_EVALUATION_DATA.json");
const recommendationPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/opportunity-recommendations/J003_01_20260812120000/opportunity_recommendations.json");
const reviewsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/holdout_human_labels.json");

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

test("V1.24A holdout identity set is unique and isolated from calibration", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const holdout = manifest.holdoutSet;
  const calibrationIds = new Set(manifest.calibrationSet.map((row) => row.opportunityId));
  assert.equal(holdout.length, 40);
  assert.equal(new Set(holdout.map((row) => row.sampleId)).size, 40);
  assert.equal(new Set(holdout.map((row) => row.opportunityId)).size, 40);
  assert.equal(new Set(holdout.map((row) => row.sourceRecordId)).size, 40);
  assert.equal(new Set(holdout.map((row) => row.queueItemId)).size, 40);
  assert.equal(holdout.some((row) => calibrationIds.has(row.opportunityId)), false);
});

test("position 30 maps to one Anthropic source identity", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const row = manifest.holdoutSet[29];
  assert.equal(row.sampleId, "H24-030");
  assert.equal(row.company, "Anthropic");
  assert.equal(row.role, "Data Science, Finance & Strategy");
  const recommendations = JSON.parse(fs.readFileSync(recommendationPath, "utf8"));
  const matches = recommendations.filter((item) => normalized(item.company) === normalized(row.company) && normalized(item.role) === normalized(row.role));
  assert.equal(matches.length, 1);
  assert.equal(matches[0].opportunityId, row.opportunityId);
  assert.equal(matches[0].sourceRecordId, row.sourceRecordId);
});

test("all persisted holdout reviews resolve to one current manifest identity", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const reviews = JSON.parse(fs.readFileSync(reviewsPath, "utf8"));
  const ids = new Set(manifest.holdoutSet.map((row) => row.sampleId));
  const reviewIds = Object.keys(reviews.records);
  assert.equal(reviewIds.length, 40);
  assert.equal(reviewIds.every((id) => ids.has(id)), true);
  assert.equal(new Set(reviewIds).size, reviewIds.length);
});
