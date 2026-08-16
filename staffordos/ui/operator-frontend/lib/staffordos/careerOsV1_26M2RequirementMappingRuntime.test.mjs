import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const modulePath = path.join(path.dirname(new URL(import.meta.url).pathname), "requirementMapping.ts");
const repoRoot = path.resolve(path.dirname(modulePath), "../../../../..");
const original = require.extensions[".ts"];
require.extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const authority = require(modulePath);
require.extensions[".ts"] = original;

test("loads the immutable L2 manifest with 41 questions and 2,003 exact targets", () => {
  const queue = authority.loadScopeSafeRequirementMappingQueue({ repositoryRoot: repoRoot, decisionRoot: fs.mkdtempSync(path.join(os.tmpdir(), "l2-runtime-")), reviewSetId: "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" });
  assert.equal(queue.length, 41);
  assert.equal(new Set(queue.flatMap((item) => item.targetRequirementIds || [])).size, 2003);
  assert.equal(queue.flatMap((item) => item.targetRequirementIds || []).length, 2003);
  assert.equal(queue.filter((item) => item.specialist).length, 18);
  assert.equal(queue.filter((item) => item.scopeClassification !== "UNSPECIFIED").length, 30);
  assert.deepEqual(authority.scopeSafeRequirementMappingProgress(queue), { decisionsCompleted: 0, decisionTotal: 41, requirementsAddressed: 0, requirementTotal: 2003 });
});

test("persists one L2 decision with exact question and target-set identity", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "l2-runtime-"));
  const queue = authority.loadScopeSafeRequirementMappingQueue({ repositoryRoot: repoRoot, decisionRoot: root, reviewSetId: "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" });
  const item = queue[0];
  const decision = authority.appendRequirementMappingDecision({ decisionRoot: root, repositoryRoot: repoRoot, item, state: "TRANSFERABLE", reviewSetId: item.reviewSetId, compressedQuestionId: item.compressedQuestionId, targetRequirementIds: item.targetRequirementIds, targetOpportunityIds: item.targetOpportunityIds, projectionRulesVersion: "CAREEROS_V1_26L2_TARGET_PROJECTION_RULES", createdAt: "2026-08-16T12:00:00.000Z" });
  const readback = authority.loadScopeSafeRequirementMappingQueue({ repositoryRoot: repoRoot, decisionRoot: root, reviewSetId: "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" }).find((entry) => entry.compressedQuestionId === item.compressedQuestionId);
  assert.equal(readback?.decision?.state, "TRANSFERABLE");
  assert.equal(readback?.decision?.reviewSetId, "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW");
  assert.equal(readback?.decision?.compressedQuestionId, item.compressedQuestionId);
  assert.deepEqual(readback?.decision?.targetRequirementIds, item.targetRequirementIds);
  assert.equal(decision.supersedesDecisionId, null);
  assert.equal(authority.scopeSafeRequirementMappingProgress(authority.loadScopeSafeRequirementMappingQueue({ repositoryRoot: repoRoot, decisionRoot: root, reviewSetId: "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" })).decisionsCompleted, 1);
});

test("editing supersedes one active L2 question without double-counting progress", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "l2-runtime-"));
  const queue = authority.loadScopeSafeRequirementMappingQueue({ repositoryRoot: repoRoot, decisionRoot: root, reviewSetId: "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" });
  const item = queue[0];
  const options = { decisionRoot: root, repositoryRoot: repoRoot, item, reviewSetId: item.reviewSetId, compressedQuestionId: item.compressedQuestionId, targetRequirementIds: item.targetRequirementIds, targetOpportunityIds: item.targetOpportunityIds, projectionRulesVersion: "CAREEROS_V1_26L2_TARGET_PROJECTION_RULES" };
  const first = authority.appendRequirementMappingDecision({ ...options, state: "DIRECT", createdAt: "2026-08-16T12:00:00.000Z" });
  authority.appendRequirementMappingDecision({ ...options, item: { ...item, decision: first }, state: "PARTIAL", createdAt: "2026-08-16T12:01:00.000Z" });
  const readbackQueue = authority.loadScopeSafeRequirementMappingQueue({ repositoryRoot: repoRoot, decisionRoot: root, reviewSetId: "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" });
  const readback = readbackQueue.find((entry) => entry.compressedQuestionId === item.compressedQuestionId);
  assert.equal(readback?.decision?.state, "PARTIAL");
  assert.equal(readback?.decision?.supersedesDecisionId, first.decisionId);
  assert.equal(authority.scopeSafeRequirementMappingProgress(readbackQueue).decisionsCompleted, 1);
});
