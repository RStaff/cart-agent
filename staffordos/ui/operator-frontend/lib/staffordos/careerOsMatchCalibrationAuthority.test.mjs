import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";
import test from "node:test";

const root = process.cwd();
const packagePath = path.join(root, "staffordos/ui/operator-frontend/package.json");
const authorityPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerOsMatchCalibrationAuthority.ts");
const routePath = path.join(root, "staffordos/ui/operator-frontend/app/os/professional/jobs/calibration/page.tsx");
const requireFromFrontend = createRequire(packagePath);
const ts = requireFromFrontend("typescript");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const authority = requireFromFrontend(authorityPath);
if (original) Module._extensions[".ts"] = original; else delete Module._extensions[".ts"];

function valid(rootPath, overrides = {}) {
  return {
    sampleId: "M21-001",
    evidenceFit: "TRANSFERABLE",
    interest: "HIGH",
    geography: "ACCEPTABLE",
    wouldPursue: "YES",
    selfConfidence: "LOW",
    reason: "Review evidence separately from confidence.",
    jobSearchRoot: rootPath,
    ...overrides,
  };
}

test("calibration labels persist in a separate owner-private authority", () => {
  const rootPath = mkdtempSync(path.join(tmpdir(), "careeros-calibration-"));
  const saved = authority.saveCalibrationReview(valid(rootPath));
  assert.equal(saved.ok, true);
  const loaded = authority.loadCalibrationReviewAuthority({ jobSearchRoot: rootPath });
  assert.equal(loaded.labelsCaptured, 1);
  assert.equal(loaded.records["M21-001"].selfConfidence, "LOW");
  assert.equal(loaded.selfConfidenceIsDiagnosticOnly, true);
  assert.equal(loaded.workflowDecisionsUsedAsGroundTruth, false);
});

test("editing a saved review updates one exact identity without increasing completion count", () => {
  const rootPath = mkdtempSync(path.join(tmpdir(), "careeros-calibration-"));
  authority.saveCalibrationReview(valid(rootPath));
  const edited = authority.saveCalibrationReview(valid(rootPath, { evidenceFit: "GOOD_MATCH", selfConfidence: "HIGH" }));
  assert.equal(edited.ok, true);
  const loaded = authority.loadCalibrationReviewAuthority({ jobSearchRoot: rootPath });
  assert.equal(loaded.labelsCaptured, 1);
  assert.equal(loaded.records["M21-001"].evidenceFit, "GOOD_MATCH");
  assert.equal(loaded.records["M21-001"].selfConfidence, "HIGH");
});

test("progress derives from exact dataset IDs and resolves the next unreviewed index", () => {
  const rootPath = mkdtempSync(path.join(tmpdir(), "careeros-calibration-"));
  authority.saveCalibrationReview(valid(rootPath, { sampleId: "M21-002" }));
  const loaded = authority.loadCalibrationReviewAuthority({ jobSearchRoot: rootPath });
  const progress = authority.deriveCalibrationReviewProgress(["M21-001", "M21-002", "M21-003"], loaded);
  assert.deepEqual(progress, { total: 3, completed: 1, remaining: 2, nextUnreviewedIndex: 0 });
});

test("invalid labels fail closed without writing", () => {
  const rootPath = mkdtempSync(path.join(tmpdir(), "careeros-calibration-"));
  const result = authority.saveCalibrationReview(valid(rootPath, { evidenceFit: "NOT_A_LABEL" }));
  assert.equal(result.ok, false);
  assert.equal(authority.loadCalibrationReviewAuthority({ jobSearchRoot: rootPath }).labelsCaptured, 0);
});

test("review labels do not expose mutation paths to career or workflow authorities", () => {
  const route = readFileSync(routePath, "utf8");
  assert.match(route, /Match Engine Calibration/);
  assert.match(route, /Save review/);
  assert.match(route, /selfConfidence/);
  assert.match(route, /reviewed/);
  assert.match(route, /Next unreviewed/);
  assert.match(route, /SAVED/);
  assert.match(route, /discard.*unsaved edits/i);
  assert.doesNotMatch(route, /<Link className="staffordHomeActionLink" href={`\/os\/professional\/jobs\/calibration\?index=\$\{index \+ 1\}`}/);
  assert.doesNotMatch(route, /CareerFact|CareerEvidence|runCareerWorkflowAction|saveJobSearchPreferences/);
});

test("holdout reviews use a separate H24 authority and do not change calibration progress", () => {
  const rootPath = mkdtempSync(path.join(tmpdir(), "careeros-holdout-"));
  const saved = authority.saveCalibrationReview(valid(rootPath, {
    sampleId: "H24-001",
    evaluationSet: "holdout",
  }));
  assert.equal(saved.ok, true);
  assert.equal(authority.loadCalibrationReviewAuthority({ jobSearchRoot: rootPath }).labelsCaptured, 0);
  const holdout = authority.loadReviewAuthority("holdout", { jobSearchRoot: rootPath });
  assert.equal(holdout.labelsCaptured, 1);
  assert.equal(holdout.records["H24-001"].selfConfidence, "LOW");
  assert.deepEqual(authority.deriveCalibrationReviewProgress(["H24-001", "H24-002"], holdout), {
    total: 2,
    completed: 1,
    remaining: 1,
    nextUnreviewedIndex: 1,
  });
});

test("holdout identity validation rejects calibration IDs and out-of-set values", () => {
  const rootPath = mkdtempSync(path.join(tmpdir(), "careeros-holdout-"));
  const wrongPrefix = authority.saveCalibrationReview(valid(rootPath, { evaluationSet: "holdout" }));
  const wrongRange = authority.saveCalibrationReview(valid(rootPath, { sampleId: "H24-041", evaluationSet: "holdout" }));
  assert.equal(wrongPrefix.ok, false);
  assert.equal(wrongRange.ok, false);
  assert.equal(authority.loadReviewAuthority("holdout", { jobSearchRoot: rootPath }).labelsCaptured, 0);
});

test("holdout route is explicitly separated from calibration and keeps frozen V2D pending", () => {
  const route = readFileSync(routePath, "utf8");
  assert.match(route, /set=holdout/);
  assert.match(route, /MATCH ENGINE HOLDOUT REVIEW/i);
  assert.match(route, /PENDING_HOLDOUT_PROJECTION/);
  assert.match(route, /HOLDOUT_SET/);
  assert.match(route, /evaluationSet/);
});
