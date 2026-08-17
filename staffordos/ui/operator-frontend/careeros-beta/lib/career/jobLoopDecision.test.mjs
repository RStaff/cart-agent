import test from "node:test";
import assert from "node:assert/strict";
import { CAREEROS_OPPORTUNITY_DECISION_LABELS, normalizeOpportunityDecision } from "./jobDecision.mjs";

test("opportunity decisions are bounded and customer-labelled", () => {
  assert.equal(normalizeOpportunityDecision("considering"), "CONSIDERING");
  assert.equal(normalizeOpportunityDecision("PURSUE"), "PURSUE");
  assert.equal(normalizeOpportunityDecision("pass"), "PASS");
  assert.deepEqual(CAREEROS_OPPORTUNITY_DECISION_LABELS, { CONSIDERING: "Considering", PURSUE: "Pursue", PASS: "Pass" });
  assert.throws(() => normalizeOpportunityDecision("REJECTED"), /INVALID_OPPORTUNITY_DECISION/);
});

test("decision state is separate from match relationship states", () => {
  const decision = normalizeOpportunityDecision("PURSUE");
  const relationshipStates = ["DIRECT", "TRANSFERABLE", "PARTIAL", "UNKNOWN", "SPECIALIST_BLOCKED"];
  assert.equal(decision, "PURSUE");
  assert.deepEqual(relationshipStates, ["DIRECT", "TRANSFERABLE", "PARTIAL", "UNKNOWN", "SPECIALIST_BLOCKED"]);
});
