import test from "node:test";
import assert from "node:assert/strict";
import { normalizeComparisonIds, summarizeOpportunityForComparison } from "./jobComparison.mjs";

const relationship = (state, text = state) => ({ id: text, state, text, explanation: `${state} explanation` });

test("comparison limits are bounded", () => {
  assert.deepEqual(normalizeComparisonIds(["a", "b", "a"]), ["a", "b"]);
  assert.throws(() => normalizeComparisonIds(["a"]), /COMPARISON_REQUIRES_TWO_OPPORTUNITIES/);
  assert.throws(() => normalizeComparisonIds(["a", "b", "c", "d", "e"]), /COMPARISON_LIMIT_EXCEEDED/);
});

test("priority is deterministic and uses existing relationship states", () => {
  const result = summarizeOpportunityForComparison({ match: { stale: false, relationships: [relationship("DIRECT", "d1"), relationship("DIRECT", "d2")] } });
  assert.equal(result.priorityLabel, "Strong evidence alignment");
  assert.equal(result.counts.DIRECT, 2);
  assert.match(result.priorityExplanation, /confirmed direct evidence/);
});

test("transferable, partial, unknown, and specialist relationships stay distinct", () => {
  const result = summarizeOpportunityForComparison({ match: { stale: false, relationships: [relationship("TRANSFERABLE"), relationship("PARTIAL"), relationship("UNKNOWN"), relationship("SPECIALIST_BLOCKED")] } });
  assert.equal(result.priorityLabel, "Mixed evidence");
  assert.equal(result.groups.transferable.length, 1);
  assert.equal(result.groups.partial.length, 1);
  assert.equal(result.groups.unknown.length, 1);
  assert.equal(result.groups.specialist.length, 1);
  assert.equal(result.evidenceFit.percentage, 25);
});

test("comparison consumes the canonical decision summary and coverage guard", () => {
  const result = summarizeOpportunityForComparison({ match: { stale: false, relationships: [relationship("DIRECT"), relationship("UNKNOWN")] } });
  assert.equal(result.priorityLabel, "Mixed evidence");
  assert.deepEqual(result.evidenceFit, { semanticKey: "EVIDENCE_COVERAGE_PERCENTAGE", status: "CURRENT", percentage: 50, numerator: 1, denominator: 2 });
});

test("comparison shows no evidence percentage when analysis is insufficient or stale", () => {
  const insufficient = summarizeOpportunityForComparison({ match: { stale: false, relationships: [relationship("DIRECT")] } });
  assert.equal(insufficient.evidenceFit.percentage, null);
  assert.equal(insufficient.priorityLabel, "More analysis needed");
  const stale = summarizeOpportunityForComparison({ match: { stale: true, relationships: [relationship("DIRECT"), relationship("DIRECT")] } });
  assert.equal(stale.evidenceFit.percentage, null);
});

test("stale evaluations are never presented as current", () => {
  const result = summarizeOpportunityForComparison({ match: { stale: true, relationships: [relationship("DIRECT")] } });
  assert.equal(result.priorityLabel, "Analysis needs to be refreshed");
  assert.equal(result.stale, true);
});
