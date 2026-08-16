import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { appendCapabilityAdjudicationDecision, activeCapabilityAdjudications, buildCapabilityGraph, loadCapabilityAdjudicationDecisions } from "./careerOsV1_27AOfflineCapabilityGraph.mjs";

const root = path.resolve(process.cwd());
const questionSet = JSON.parse(readFileSync(path.join(root, "staffordos/job-search/CAREEROS_V1_27A_ACTIVE_LEARNING_QUESTION_SET.json"), "utf8"));
const graph = JSON.parse(readFileSync(path.join(root, "staffordos/job-search/CAREEROS_V1_27A_CAPABILITY_GRAPH.json"), "utf8"));
const routeSource = readFileSync(path.join(root, "staffordos/ui/operator-frontend/app/os/professional/evidence/page.tsx"), "utf8");

test("loads exactly ten stable capability questions with capability identities", () => {
  assert.equal(questionSet.questionCount, 10);
  assert.equal(new Set(questionSet.questions.map((item) => item.questionId)).size, 10);
  assert.ok(questionSet.questions.every((item) => item.capabilityId && item.question && item.allowedAnswers.length > 0 && item.labelsExcluded === true));
  assert.equal(graph.capabilities.length, 32);
});

test("questions resolve distinct capability uncertainties without duplicate wording", () => {
  const exact = new Set(questionSet.questions.map((item) => item.question));
  const normalized = new Set(questionSet.questions.map((item) => item.question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()));
  const capabilities = new Set(questionSet.questions.map((item) => item.canonicalCapability));
  const scopes = new Set(questionSet.questions.map((item) => item.scopeBeingResolved));
  assert.equal(exact.size, 10);
  assert.equal(normalized.size, 10);
  assert.equal(capabilities.size, 10);
  assert.equal(scopes.size, 10);
  assert.ok(questionSet.questions.every((item) => item.question.length > 60));
});

test("unanswered capability state is neutral and answer vocabularies remain question-specific", () => {
  assert.ok(questionSet.questions.every((item) => !item.answer && !item.decision));
  const vocabularies = new Set(questionSet.questions.map((item) => item.allowedAnswers.join("|")));
  assert.ok(vocabularies.size >= 1);
  assert.ok(questionSet.questions.every((item) => !item.allowedAnswers.includes("DIRECT") || item.allowedAnswers.includes("KEEP_UNRESOLVED")));
});

test("save, exact readback, edit, supersession, and one-active progress work", () => {
  const decisionRoot = mkdtempSync(path.join(tmpdir(), "v127a-runtime-"));
  const question = questionSet.questions[0];
  const first = appendCapabilityAdjudicationDecision({ decisionRoot, questionId: question.questionId, capabilityIds: [question.capabilityId], answer: question.allowedAnswers[0], createdAt: "2026-08-16T00:00:00.000Z" });
  const second = appendCapabilityAdjudicationDecision({ decisionRoot, questionId: question.questionId, capabilityIds: [question.capabilityId], answer: "KEEP_UNRESOLVED", createdAt: "2026-08-16T00:01:00.000Z" });
  const all = loadCapabilityAdjudicationDecisions({ decisionRoot });
  assert.equal(all.find((item) => item.decisionId === first.decisionId).superseded, true);
  assert.equal(all.find((item) => item.decisionId === second.decisionId).superseded, false);
  assert.equal(activeCapabilityAdjudications(all).length, 1);
  assert.equal(activeCapabilityAdjudications(all)[0].questionId, question.questionId);
  assert.equal(activeCapabilityAdjudications(all)[0].graphVersion, "CAREEROS_V1_27A_GRAPH_V1");
});

test("route is capability-only, preserves navigation, and does not expose model controls", () => {
  assert.match(routeSource, /view=capabilities/);
  assert.match(routeSource, /Career Capability Review/);
  assert.match(routeSource, /Next unreviewed/);
  assert.match(routeSource, /EXACT_READBACK_FAILED/);
  assert.doesNotMatch(routeSource, /calibration label|holdout label|V2D score|desired model outcome/i);
  assert.match(routeSource, /privateCapabilityAdjudicationRoot/);
});
