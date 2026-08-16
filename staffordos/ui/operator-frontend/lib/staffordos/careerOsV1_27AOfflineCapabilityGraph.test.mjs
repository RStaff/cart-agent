import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { appendCapabilityAdjudicationDecision, auditActiveLearningQuestions, buildCapabilityGraph, buildRequirementConceptGraph, loadCapabilityAdjudicationDecisions, projectCapabilityRequirementRelationships } from "./careerOsV1_27AOfflineCapabilityGraph.mjs";

const fact = (overrides = {}) => ({ id: "careerfact_fixture", statement: "Led cross-functional technical program delivery", normalizedStatement: "led cross functional technical program delivery", factType: "EMPLOYMENT", supportLevel: "DIRECT", verificationStatus: "VERIFIED", sourceEvidenceIds: ["careerev_fixture"], sourceDecisionIds: ["decision_fixture"], conflictingEvidenceIds: [], conflictTypes: [], ...overrides });
const manifest = { questions: [{ targets: [{ requirementId: "req-1", opportunityId: "opp-1", capabilityFamily: "PROGRAM_DELIVERY", specialist: false, scopeClassification: "LED_PROGRAM" }, { requirementId: "req-2", opportunityId: "opp-2", capabilityFamily: "PROGRAM_DELIVERY", specialist: false, scopeClassification: "OWNERSHIP" }, { requirementId: "req-3", opportunityId: "opp-3", capabilityFamily: "PROGRAM_DELIVERY", specialist: true, scopeClassification: "LED_PROGRAM" }] }] };

test("graph identity, source edges, and requirement concepts are deterministic", () => {
  const first = buildCapabilityGraph({ facts: [fact()], evidence: [{ id: "careerev_fixture" }] });
  const second = buildCapabilityGraph({ facts: [fact()], evidence: [{ id: "careerev_fixture" }] });
  assert.deepEqual(first, second);
  assert.equal(first.capabilities.length, 1);
  assert.equal(first.edges.factEdges[0].edgeType, "ESTABLISHES_CAPABILITY");
  assert.equal(first.edges.evidenceEdges[0].edgeType, "SUPPORTS_CAPABILITY");
  const concepts = buildRequirementConceptGraph(manifest);
  assert.equal(concepts.rawMappings.length, 3);
  assert.ok(concepts.rawMappings.every((row) => row.requirementId && row.opportunityId && row.conceptId));
});

test("scope and specialist firewalls fail closed", () => {
  const graph = buildCapabilityGraph({ facts: [fact()] });
  const concepts = buildRequirementConceptGraph(manifest);
  const result = projectCapabilityRequirementRelationships({ capabilities: graph.capabilities, concepts: concepts.concepts, adjudications: [] });
  assert.equal(result.counts.TRANSFERABLE, 0);
  assert.equal(result.counts.PARTIAL, 0);
  assert.equal(result.counts.SCOPE_BLOCKED > 0, true);
  assert.equal(result.counts.SPECIALIST_BLOCKED > 0, true);
  assert.equal(result.specialistLeakage, 0);
  assert.equal(result.scopeViolations, 0);
});

test("capability adjudication is append-only, neutral by default, and supersedes one active decision", () => {
  const root = mkdtempSync(path.join(tmpdir(), "v127a-capability-"));
  const graph = buildCapabilityGraph({ facts: [fact()] });
  const capabilityId = graph.capabilities[0].capabilityId;
  assert.deepEqual(loadCapabilityAdjudicationDecisions({ decisionRoot: root }), []);
  const first = appendCapabilityAdjudicationDecision({ decisionRoot: root, questionId: "capability_question_fixture", capabilityIds: [capabilityId], answer: "TRANSFERABLE_ANALOG", createdAt: "2026-08-16T00:00:00.000Z" });
  const second = appendCapabilityAdjudicationDecision({ decisionRoot: root, questionId: "capability_question_fixture", capabilityIds: [capabilityId], answer: "PARTIAL", createdAt: "2026-08-16T00:01:00.000Z" });
  const decisions = loadCapabilityAdjudicationDecisions({ decisionRoot: root });
  assert.equal(decisions.length, 2);
  assert.equal(decisions.find((item) => item.decisionId === first.decisionId).superseded, true);
  assert.equal(decisions.find((item) => item.decisionId === second.decisionId).superseded, false);
  assert.equal(decisions.filter((item) => !item.superseded).length, 1);
  assert.match(readFileSync(path.join(root, "capability-adjudications.ndjson"), "utf8"), /SUPERSESSION/);
});

test("active-learning audit links questions to capabilities and proposed concepts without using labels", () => {
  const graph = buildCapabilityGraph({ facts: [fact()] });
  const concepts = buildRequirementConceptGraph(manifest);
  const questions = auditActiveLearningQuestions({ questions: [{ questionId: "q1", canonicalCapability: "TECHNICAL_PROGRAM_LEADERSHIP", question: "What scope?", allowedAnswers: ["TRANSFERABLE_ANALOG"], informationValue: 5 }], capabilities: graph.capabilities, concepts: concepts.concepts });
  assert.equal(questions[0].capabilityId, graph.capabilities[0].capabilityId);
  assert.ok(questions[0].affectedConceptIds.length > 0);
  assert.equal(questions[0].labelsExcluded, true);
});
