import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const requireFromFrontend = createRequire(path.join(path.dirname(new URL(import.meta.url).pathname), "../../package.json"));
const ts = requireFromFrontend("typescript");
const modulePath = path.join(path.dirname(new URL(import.meta.url).pathname), "conflictResolution.ts");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { appendConflictResolutionDecision, buildConflictReviewQueue, classifyConflictType, conflictProgress, conflictTypeDistribution, loadConflictResolutionDecisions, outcomeForAnswer } = requireFromFrontend(modulePath);
Module._extensions[".ts"] = original;

const base = (overrides = {}) => ({ operatorQuestion: "Have you directly led cross-functional work?", whyAsked: "Scope must be bounded.", conflictStates: ["CONFLICTING"], sourceProvenanceStates: ["NO_LINKED_SOURCE"], underlyingCandidateCount: 2, ...overrides });

test("conflict taxonomy is deterministic and bounded", () => {
  assert.equal(classifyConflictType(base()), "RESPONSIBILITY_SCOPE_CONFLICT");
  assert.equal(classifyConflictType(base({ operatorQuestion: "Have you designed or implemented software directly?" })), "TECHNICAL_DEPTH_CONFLICT");
  assert.equal(classifyConflictType(base({ operatorQuestion: "Did you directly manage people?" })), "LEADERSHIP_SCOPE_CONFLICT");
  assert.equal(classifyConflictType(base({ operatorQuestion: "What dates apply to this role?", whyAsked: "Resolve historical dates." })), "TEMPORAL_CONFLICT");
});

test("question queue preserves cluster boundaries and outcome semantics", () => {
  const queue = buildConflictReviewQueue([
    base({ clusterId: "one", operatorAnswer: "DIRECT" }),
    base({ clusterId: "two", operatorAnswer: "TRANSFERABLE", operatorQuestion: "Have you designed or implemented software directly?" }),
    base({ clusterId: "three", operatorAnswer: "KEEP_UNRESOLVED", conflictStates: ["UNKNOWN"], sourceProvenanceStates: ["LINKED_SOURCE"] }),
  ], [
    { questionId: "one", answer: "DIRECT" },
    { questionId: "two", answer: "TRANSFERABLE" },
  ]);
  assert.equal(queue.length, 2);
  assert.equal(queue[0].currentOutcome, "VERIFIED_DIRECT");
  assert.equal(queue[1].currentOutcome, "VERIFIED_TRANSFERABLE");
  assert.equal(conflictTypeDistribution(queue).RESPONSIBILITY_SCOPE_CONFLICT, 1);
  assert.equal(outcomeForAnswer("ADJACENT"), "PARTIALLY_SUPPORTED");
  assert.equal(outcomeForAnswer("NO"), "REJECTED");
  assert.equal(outcomeForAnswer("NEEDS_EVIDENCE"), "KEEP_UNRESOLVED");
});

test("historical high-value answers do not count as conflict decisions", () => {
  const queue = buildConflictReviewQueue([base({ clusterId: "question_1", operatorAnswer: "DIRECT" })]);
  assert.equal(queue[0].historicalHighValueAnswer, "DIRECT");
  assert.equal(queue[0].conflictDecision, null);
  assert.equal(queue[0].currentOutcome, "KEEP_UNRESOLVED");
  assert.deepEqual(conflictProgress(queue), { completed: 0, total: 1 });
});

test("conflict decision persistence is separate, exact, and supersedable", () => {
  const directory = fs.mkdtempSync(path.join("/tmp", "career-conflict-"));
  try {
    const first = appendConflictResolutionDecision({
      decisionRoot: directory,
      repositoryRoot: process.cwd(),
      questionId: "question_1",
      answer: "DIRECT",
      underlyingCandidateIds: ["candidate_1"],
      propagationEligibleCandidateIds: ["candidate_1"],
      createdAt: "2026-08-15T12:00:00.000Z",
    });
    const second = appendConflictResolutionDecision({
      decisionRoot: directory,
      repositoryRoot: process.cwd(),
      questionId: "question_1",
      answer: "KEEP_UNRESOLVED",
      underlyingCandidateIds: ["candidate_1"],
      propagationEligibleCandidateIds: ["candidate_1"],
      priorDecisionId: first.decisionId,
      createdAt: "2026-08-15T12:01:00.000Z",
    });
    const decisions = loadConflictResolutionDecisions({ decisionRoot: directory, repositoryRoot: process.cwd() });
    const queue = buildConflictReviewQueue([base({ clusterId: "question_1", operatorAnswer: "DIRECT" })], decisions);
    assert.equal(decisions.length, 2);
    assert.equal(queue[0].conflictDecision.decisionId, second.decisionId);
    assert.equal(queue[0].currentOutcome, "KEEP_UNRESOLVED");
    assert.deepEqual(conflictProgress(queue), { completed: 1, total: 1 });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
