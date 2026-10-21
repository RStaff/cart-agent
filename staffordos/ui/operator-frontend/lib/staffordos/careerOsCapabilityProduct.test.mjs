import test from "node:test";
import assert from "node:assert/strict";
import { deriveCapabilityCandidates, decisionStateForAnswer } from "../../careeros-beta/lib/career/capabilityCatalog.mjs";
import { parseJobDescription } from "../../careeros-beta/lib/career/jobProduct.mjs";

test("derives reusable capabilities from confirmed facts with provenance", () => {
  const result = deriveCapabilityCandidates([
    { id: "fact-1", sourceId: "source-1", factType: "PROJECT", statement: "Owned a cross-functional program launch across product and operations." },
    { id: "fact-2", sourceId: "source-1", factType: "LEADERSHIP", statement: "Led stakeholder planning and delivery." },
  ]);
  assert.ok(result.some((item) => item.capabilityKey === "PROGRAM_DELIVERY"));
  assert.ok(result.some((item) => item.capabilityKey === "CROSS_FUNCTIONAL_COORDINATION"));
  assert.equal(result.some((item) => item.capabilityKey === "PEOPLE_MANAGEMENT"), false);
  assert.equal(result[0].authorityState, "NEEDS_MORE_EVIDENCE");
  assert.deepEqual(result[0].provenance.factIds.includes("fact-1"), true);
});

test("does not infer people management from generic leadership", () => {
  const result = deriveCapabilityCandidates([{ id: "fact-1", sourceId: "source-1", factType: "LEADERSHIP", statement: "Led a technical initiative with multiple stakeholders." }]);
  assert.equal(result.some((item) => item.capabilityKey === "PEOPLE_MANAGEMENT"), false);
});

test("job parser preserves user supplied plaintext and specialist boundaries", () => {
  const result = parseJobDescription({ title: "Program Lead", description: "Lead cross-functional delivery. Security clearance required. Deliver measurable outcomes." });
  assert.equal(result.sourceType, "USER_SUPPLIED_SOURCE");
  assert.equal(result.requirements.some((item) => item.specialist), true);
  assert.equal(result.requirements.some((item) => item.conceptKey === "CROSS_FUNCTIONAL_COORDINATION"), true);
});

test("answers retain frozen relationship distinctions", () => {
  assert.equal(decisionStateForAnswer("DIRECT"), "VERIFIED_DIRECT");
  assert.equal(decisionStateForAnswer("TRANSFERABLE"), "VERIFIED_TRANSFERABLE");
  assert.equal(decisionStateForAnswer("PARTIAL"), "PARTIALLY_SUPPORTED");
  assert.equal(decisionStateForAnswer("KEEP_UNRESOLVED"), "KEEP_UNRESOLVED");
});
