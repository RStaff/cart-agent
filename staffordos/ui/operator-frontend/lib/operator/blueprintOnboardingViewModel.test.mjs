import test from "node:test";
import assert from "node:assert/strict";
import { blueprintSaveMessage, blueprintWorkspaceActions } from "./blueprintOnboardingViewModel.mjs";

test("workspace exposes only state-compatible actions and readiness-gated transitions", () => {
  let actions = blueprintWorkspaceActions({ engagement: { state: "PAID_IDENTITY_REVIEW" }, onboarding: null });
  assert.equal(actions.identity, true);
  assert.deepEqual(actions.transitions, [{ nextState: "ONBOARDING", enabled: false }]);

  actions = blueprintWorkspaceActions({
    engagement: { state: "ONBOARDING" },
    onboarding: { identityDecision: "LEAVE_UNASSOCIATED_PENDING", safeOperatingContactConfirmed: true },
  });
  assert.equal(actions.workflow, true);
  assert.equal(actions.interview, false);
  assert.deepEqual(actions.transitions, [
    { nextState: "WAITING_FOR_CLIENT_INPUT", enabled: true },
    { nextState: "READY_FOR_INTERVIEW", enabled: false },
  ]);

  actions = blueprintWorkspaceActions({
    engagement: { state: "INTERVIEW_COMPLETE" },
    onboarding: {
      identityDecision: "LEAVE_UNASSOCIATED_PENDING",
      safeOperatingContactConfirmed: true,
      workflowBoundary: { name: "Workflow" },
      workflowClientConfirmedAt: "2026-10-01T12:00:00Z",
      workflowClientConfirmationEvidenceRef: "evidence://workflow",
      requiredInputChecklist: { readinessSatisfied: true, allSixDeliverablesAchievable: true },
      currentInterviewCompletedAt: "2026-10-02T12:00:00Z",
      currentInterviewEvidenceRef: "evidence://interview",
    },
  });
  assert.equal(actions.transitions.find((item) => item.nextState === "DELIVERY_READY").enabled, true);
});

test("stale and expired feedback gives recovery guidance without discarding form input", () => {
  assert.match(blueprintSaveMessage(409, "BLUEPRINT_ONBOARDING_STALE_VERSION"), /entries are still here/i);
  assert.match(blueprintSaveMessage(401, "OPERATOR_SESSION_EXPIRED"), /Sign in again/i);
});
