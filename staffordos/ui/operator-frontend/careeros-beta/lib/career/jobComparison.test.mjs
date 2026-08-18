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
  assert.equal(result.priorityLabel, "Worth reviewing - some evidence gaps");
  assert.equal(result.groups.transferable.length, 1);
  assert.equal(result.groups.partial.length, 1);
  assert.equal(result.groups.unknown.length, 1);
  assert.equal(result.groups.specialist.length, 1);
  assert.equal("percentage" in result, false);
});

test("stale evaluations are never presented as current", () => {
  const result = summarizeOpportunityForComparison({ match: { stale: true, relationships: [relationship("DIRECT")] } });
  assert.equal(result.priorityLabel, "Needs updated analysis");
  assert.equal(result.stale, true);
});
