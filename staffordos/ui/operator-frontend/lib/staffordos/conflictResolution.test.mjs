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
const { buildConflictReviewQueue, classifyConflictType, conflictTypeDistribution, outcomeForAnswer } = requireFromFrontend(modulePath);
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
  ]);
  assert.equal(queue.length, 2);
  assert.equal(queue[0].currentOutcome, "VERIFIED_DIRECT");
  assert.equal(queue[1].currentOutcome, "VERIFIED_TRANSFERABLE");
  assert.equal(conflictTypeDistribution(queue).RESPONSIBILITY_SCOPE_CONFLICT, 1);
  assert.equal(outcomeForAnswer("ADJACENT"), "PARTIALLY_SUPPORTED");
  assert.equal(outcomeForAnswer("NO"), "REJECTED");
  assert.equal(outcomeForAnswer("NEEDS_EVIDENCE"), "KEEP_UNRESOLVED");
});
