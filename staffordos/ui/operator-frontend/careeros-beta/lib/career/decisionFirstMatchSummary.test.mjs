import assert from "node:assert/strict";
import test from "node:test";
import { buildDecisionFirstMatchSummary } from "./decisionFirstMatchSummary.mjs";

const relationship = (state, capabilityLabel, text = capabilityLabel) => ({ state, capabilityLabel, text, explanation: `${state} explanation` });

test("strong multi-requirement alignment is qualitative and evidence grounded", () => {
  const result = buildDecisionFirstMatchSummary({ stale: false, relationships: [
    relationship("DIRECT", "Program delivery"),
    relationship("DIRECT", "Technology implementation"),
    relationship("TRANSFERABLE", "Cross-functional coordination"),
  ] });
  assert.equal(result.assessment, "STRONG_ALIGNMENT");
  assert.equal(result.coverage, "MEANINGFUL");
  assert.deepEqual(result.strongAreas, ["Program delivery", "Technology implementation"]);
  assert.match(result.explanation, /confirmed direct evidence/i);
  assert.equal("score" in result, false);
});

test("gaps and specialist constraints remain visible in the summary", () => {
  const result = buildDecisionFirstMatchSummary({ stale: false, relationships: [
    relationship("DIRECT", "Program delivery"),
    relationship("TRANSFERABLE", "Training and enablement"),
    relationship("PARTIAL", "Analytics and reporting"),
    relationship("UNKNOWN", null, "Security experience"),
    relationship("SPECIALIST_BLOCKED", null, "Active clearance"),
  ] });
  assert.equal(result.assessment, "MIXED_ALIGNMENT");
  assert.deepEqual(result.gaps, ["Analytics and reporting", "Security experience"]);
  assert.deepEqual(result.specialistConstraints, ["Active clearance"]);
  assert.match(result.bottomLine, /review/i);
});

test("a single broad requirement cannot produce strong alignment", () => {
  const result = buildDecisionFirstMatchSummary({ stale: false, relationships: [relationship("DIRECT", "Program delivery", "Lead programs and related work")] });
  assert.equal(result.assessment, "INSUFFICIENT_ANALYSIS");
  assert.equal(result.coverage, "INSUFFICIENT");
  assert.match(result.explanation, /more meaningful job requirements/i);
});

test("stale analysis blocks a current assessment without changing the customer decision", () => {
  const result = buildDecisionFirstMatchSummary({ stale: true, decisionState: "PURSUE", relationships: [relationship("DIRECT", "Program delivery"), relationship("DIRECT", "Delivery") ] });
  assert.equal(result.assessment, "STALE_ANALYSIS");
  assert.match(result.bottomLine, /re-analyze/i);
  assert.equal(result.decisionState, "PURSUE");
});

test("substantial unresolved coverage is mixed evidence, not promising alignment", () => {
  const result = buildDecisionFirstMatchSummary({ stale: false, relationships: [
    ...Array.from({ length: 12 }, (_, index) => relationship("DIRECT", `Direct ${index + 1}`)),
    ...Array.from({ length: 4 }, (_, index) => relationship("TRANSFERABLE", `Transferable ${index + 1}`)),
    ...Array.from({ length: 35 }, (_, index) => relationship("UNKNOWN", null, `Unknown ${index + 1}`)),
  ] });
  assert.equal(result.assessment, "MIXED_ALIGNMENT");
  assert.match(result.bottomLine, /meaningful alignment/i);
  assert.match(result.bottomLine, /limited/i);
});

test("promising alignment requires complete meaningful coverage", () => {
  const result = buildDecisionFirstMatchSummary({ stale: false, relationships: [
    relationship("DIRECT", "Program delivery"),
    relationship("TRANSFERABLE", "Training and enablement"),
  ] });
  assert.equal(result.assessment, "PROMISING_ALIGNMENT");
});

test("evidence fit counts direct and transferable support without inventing weights", () => {
  const result = buildDecisionFirstMatchSummary({ stale: false, relationships: [
    relationship("DIRECT", "Program delivery"),
    relationship("DIRECT", "Technology implementation"),
    relationship("TRANSFERABLE", "Training"),
    relationship("PARTIAL", "Analytics"),
    relationship("UNKNOWN", null, "Clearance"),
    relationship("SPECIALIST_BLOCKED", null, "License"),
  ] });
  assert.deepEqual(result.evidenceFit, { semanticKey: "EVIDENCE_COVERAGE_PERCENTAGE", status: "CURRENT", percentage: 50, numerator: 3, denominator: 6 });
});

test("evidence fit does not produce a percentage for insufficient or stale analysis", () => {
  const insufficient = buildDecisionFirstMatchSummary({ stale: false, relationships: [relationship("DIRECT", "One requirement")] });
  assert.deepEqual(insufficient.evidenceFit, { semanticKey: "EVIDENCE_COVERAGE_PERCENTAGE", status: "INSUFFICIENT", percentage: null, numerator: 1, denominator: 1 });
  const stale = buildDecisionFirstMatchSummary({ stale: true, relationships: [relationship("DIRECT", "d1"), relationship("DIRECT", "d2")] });
  assert.deepEqual(stale.evidenceFit, { semanticKey: "EVIDENCE_COVERAGE_PERCENTAGE", status: "STALE", percentage: null, numerator: 2, denominator: 2 });
});
