import test from "node:test";
import assert from "node:assert/strict";
import { reconstructExactTargetManifest } from "./careerOsV1_26L1ExactTargetManifest.mjs";

const req = (id, text, extra = {}) => ({ id, jobOpportunityId: `opp-${id}`, sourceId: `source-${id}`, requirementText: text, requirementCategory: "Responsibility", requirementLevel: "RESPONSIBILITY", importanceClassification: "Required", ...extra });
test("reconstructs exact requirement and opportunity identity without duplicates", () => {
  const result = reconstructExactTargetManifest({ requirements: [req("r1", "Lead cross-functional programs"), req("r2", "Lead cross-functional programs")], mappings: [{ requirementId: "r1", classification: "UNKNOWN" }, { requirementId: "r2", classification: "UNKNOWN" }], round1RequirementIds: new Set(), originalQueue: { queueSize: 1, questions: [{ capabilityFamily: "PROGRAM_DELIVERY" }] } });
  assert.equal(result.uniqueTargetRequirements, 2); assert.equal(result.duplicateTargetCount, 0); assert.equal(result.questions[0].targetRequirements[0].requirementId, "r1"); assert.equal(result.questions[0].targetRequirements[0].opportunityId, "opp-r1");
});
test("existing positive mappings are excluded and specialist scope is preserved", () => {
  const result = reconstructExactTargetManifest({ requirements: [req("r1", "Lead cross-functional programs"), req("r2", "Build production software engineering systems", { requirementLevel: "SOFTWARE_ENGINEERING" })], mappings: [{ requirementId: "r1", classification: "PROVEN" }, { requirementId: "r2", classification: "UNKNOWN" }] });
  assert.equal(result.round1OverlapCount, 0); assert.equal(result.questions.flatMap((q) => q.targetRequirements).some((x) => x.requirementId === "r1"), false); assert.equal(result.specialistTargetCount, 1);
});
test("reconstruction is deterministic and preserves exact source text", () => {
  const input = { requirements: [req("r1", "Own the cross-functional program backlog")], mappings: [{ requirementId: "r1", classification: "UNKNOWN" }] }; const a = reconstructExactTargetManifest(input); const b = reconstructExactTargetManifest(input); assert.equal(a.manifestHash, b.manifestHash); assert.equal(a.questions[0].targetRequirements[0].exactRequirementText, "Own the cross-functional program backlog");
});
