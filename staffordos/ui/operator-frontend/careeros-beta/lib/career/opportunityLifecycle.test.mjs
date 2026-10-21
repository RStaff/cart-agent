import test from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_LIFECYCLE_TRANSITIONS, canTransition, lifecycleEventFor, nextOpportunityAction, triageBucket } from "./opportunityLifecycle.mjs";

test("lifecycle transitions are explicit and fail closed", () => {
  assert.equal(canTransition("NEW", "CONSIDERING"), true);
  assert.equal(canTransition("PURSUE", "APPLIED"), true);
  assert.equal(canTransition("APPLIED", "INTERVIEWING"), true);
  assert.equal(canTransition("REJECTED", "PURSUE"), false);
  assert.equal(canTransition("CLOSED", "CONSIDERING"), false);
  assert.deepEqual(ALLOWED_LIFECYCLE_TRANSITIONS.OFFER, ["WITHDRAWN", "CLOSED"]);
});

test("decision and lifecycle drive separate next actions", () => {
  assert.equal(nextOpportunityAction({ decisionState: "PURSUE", lifecycleState: "NEW" }), "Prepare and submit the application");
  assert.equal(nextOpportunityAction({ decisionState: "PURSUE", lifecycleState: "APPLIED" }), "Waiting for a response");
  assert.equal(nextOpportunityAction({ decisionState: "CONSIDERING", lifecycleState: "INTERVIEWING" }), "Prepare for the interview");
  assert.equal(nextOpportunityAction({ decisionState: "CONSIDERING", lifecycleState: "REJECTED" }), "No action required");
});

test("triage and outcome events remain deterministic", () => {
  assert.equal(triageBucket({ lifecycleState: "PURSUE" }), "PURSUE");
  assert.equal(triageBucket({ lifecycleState: "OFFER" }), "CLOSED");
  assert.equal(lifecycleEventFor("APPLIED"), "APPLICATION_MARKED_APPLIED");
  assert.equal(lifecycleEventFor("INTERVIEWING"), "INTERVIEW_MARKED");
});
