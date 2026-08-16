import test from "node:test";
import assert from "node:assert/strict";
import { buildRequirementReuseAudit, normalizeRequirement } from "./careerOsV1_26LRequirementReuse.mjs";

const req = (id, text, extra = {}) => ({ id, jobOpportunityId: `job-${id}`, requirementText: text, normalizedRequirement: text, requirementCategory: "Responsibility", requirementLevel: "RESPONSIBILITY", importanceClassification: "Required", ...extra });
const dec = (id, state) => ({ decisionId: `decision-${id}`, requirementId: id, state, createdAt: "2026-08-16T00:00:00Z" });

test("normalization accepts formatting-only duplicates", () => assert.equal(normalizeRequirement({ requirementText: "Lead cross-functional programs." }), "lead cross functional programs"));
test("exact reuse preserves state and requires compatible scope", () => {
  const result = buildRequirementReuseAudit({ requirements: [req("a", "Lead cross-functional programs."), req("b", "lead cross functional programs")], decisions: [dec("a", "TRANSFERABLE")] });
  assert.equal(result.reuse.length, 1); assert.equal(result.reuse[0].state, "TRANSFERABLE");
});
test("specialist mismatch blocks reuse", () => {
  const result = buildRequirementReuseAudit({ requirements: [req("a", "Lead technical programs"), req("b", "Lead technical programs", { requirementCategory: "Specialist", requirementLevel: "SOFTWARE_ENGINEERING" })], decisions: [dec("a", "DIRECT")] });
  assert.equal(result.reuse.length, 0); assert.equal(result.sourceStats.rejectedSpecialist, 1);
});
test("negative and unresolved decisions never create reuse", () => {
  const result = buildRequirementReuseAudit({ requirements: [req("a", "Lead cross-functional programs"), req("b", "Lead cross-functional programs")], decisions: [dec("a", "NO_SUPPORTED_EQUIVALENT")] });
  assert.equal(result.reuse.length, 0);
});
