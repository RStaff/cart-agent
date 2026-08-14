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
  assert.doesNotMatch(route, /CareerFact|CareerEvidence|runCareerWorkflowAction|saveJobSearchPreferences/);
});
