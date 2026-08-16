import test from "node:test";
import assert from "node:assert/strict";
import { compressScopeSafeManifest } from "./careerOsV1_26L2ScopeSafeCompression.mjs";

const target = (id, scope, specialist = false, importance = "Required") => ({ requirementId: id, opportunityId: `op_${id}`, exactRequirementText: `Requirement ${id}`, capabilityFamily: "PROGRAM_DELIVERY", specialist, scopeClassification: scope, importance });
const sourceQuestion = (id, scope, importance, targets) => ({ questionId: id, capabilityFamily: "PROGRAM_DELIVERY", specialistClass: "SPECIALIST" === "SPECIALIST" && targets.some((item) => item.specialist) ? "SPECIALIST" : "GENERAL", scopeClassification: scope, importance, targetRequirements: targets });

test("compresses only importance variants within identical scope and specialist boundaries", () => {
  const manifest = { manifestHash: "source", reconstructedQuestionCount: 4, questions: [
    sourceQuestion("review_gap_01", "OWNERSHIP", "Required", [target("r1", "OWNERSHIP", false, "Required")]),
    sourceQuestion("review_gap_02", "OWNERSHIP", "Preferred", [target("r2", "OWNERSHIP", false, "Preferred")]),
    sourceQuestion("review_gap_03", "PROGRAM_LEADERSHIP", "Required", [target("r3", "PROGRAM_LEADERSHIP", false)]),
    sourceQuestion("review_gap_04", "OWNERSHIP", "Required", [target("r4", "OWNERSHIP", true)]),
  ] };
  const compressed = compressScopeSafeManifest(manifest, { validateInput: false });
  assert.equal(compressed.compressedQuestionCount, 3);
  assert.equal(compressed.uniqueTargetCount, 4);
  assert.equal(compressed.duplicateTargetCount, 0);
  assert.deepEqual(compressed.questions[0].sourceQuestionIds, ["review_gap_01", "review_gap_02"]);
});

test("target-specific rules preserve exact identity and relationship states", () => {
  const manifest = { manifestHash: "source", reconstructedQuestionCount: 1, questions: [sourceQuestion("review_gap_01", "OWNERSHIP", "Required", [target("r1", "OWNERSHIP")])] };
  const compressed = compressScopeSafeManifest(manifest, { validateInput: false });
  const rule = compressed.questions[0].targetProjectionRules[0];
  assert.equal(rule.requirementId, "r1");
  assert.equal(rule.opportunityId, "op_r1");
  assert.deepEqual(rule.rules.map((item) => item.relationship), ["DIRECT", "TRANSFERABLE", "PARTIAL", "NO_SUPPORTED_EQUIVALENT", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"]);
  assert.notEqual(rule.rules[0].relationship, rule.rules[1].relationship);
});

test("compression is deterministic and retains specialist and scope firewalls", () => {
  const manifest = { manifestHash: "source", reconstructedQuestionCount: 2, questions: [
    sourceQuestion("review_gap_02", "PORTFOLIO_ENTERPRISE", "Required", [target("r2", "PORTFOLIO_ENTERPRISE", true)]),
    sourceQuestion("review_gap_01", "PORTFOLIO_ENTERPRISE", "Preferred", [target("r1", "PORTFOLIO_ENTERPRISE", false)]),
  ] };
  const first = compressScopeSafeManifest(manifest, { validateInput: false });
  const second = compressScopeSafeManifest(manifest, { validateInput: false });
  assert.equal(first.manifestHash, second.manifestHash);
  assert.equal(first.compressedQuestionCount, 2);
  assert.deepEqual(first.questions.map((question) => question.specialistClass).sort(), ["GENERAL", "SPECIALIST"]);
  assert.deepEqual(first.questions.map((question) => question.scopeClassification), ["PORTFOLIO_ENTERPRISE", "PORTFOLIO_ENTERPRISE"]);
});
