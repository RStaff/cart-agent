const TRANSITIONS = Object.freeze({
  PAID_IDENTITY_REVIEW: ["ONBOARDING"],
  ONBOARDING: ["WAITING_FOR_CLIENT_INPUT", "READY_FOR_INTERVIEW"],
  WAITING_FOR_CLIENT_INPUT: ["ONBOARDING", "READY_FOR_INTERVIEW"],
  READY_FOR_INTERVIEW: ["INTERVIEW_COMPLETE", "WAITING_FOR_CLIENT_INPUT"],
  INTERVIEW_COMPLETE: ["WAITING_FOR_CLIENT_INPUT", "DELIVERY_READY"],
  DELIVERY_READY: [],
});

export function blueprintWorkspaceActions(detail) {
  const engagement = detail?.engagement || {};
  const onboarding = detail?.onboarding || {};
  const state = String(engagement.state || "");
  const identityReady = Boolean(onboarding.identityDecision && onboarding.safeOperatingContactConfirmed);
  const workflowReady = Boolean(onboarding.workflowBoundary && onboarding.workflowClientConfirmedAt && onboarding.workflowClientConfirmationEvidenceRef);
  const checklist = onboarding.requiredInputChecklist;
  const checklistExists = Boolean(checklist);
  const interviewReady = Boolean(onboarding.currentInterviewCompletedAt && onboarding.currentInterviewEvidenceRef);
  const deliveryReady = identityReady && workflowReady && checklist?.readinessSatisfied === true && checklist?.allSixDeliverablesAchievable === true && interviewReady;
  const transitions = (TRANSITIONS[state] || []).map((nextState) => ({
    nextState,
    enabled:
      (state !== "PAID_IDENTITY_REVIEW" || identityReady) &&
      (nextState !== "READY_FOR_INTERVIEW" || (identityReady && workflowReady && checklistExists)) &&
      (nextState !== "INTERVIEW_COMPLETE" || interviewReady) &&
      (nextState !== "DELIVERY_READY" || deliveryReady),
  }));
  return {
    identity: state === "PAID_IDENTITY_REVIEW",
    workflow: ["ONBOARDING", "WAITING_FOR_CLIENT_INPUT"].includes(state) && !onboarding.currentInterviewCompletedAt,
    requiredInputs: ["ONBOARDING", "WAITING_FOR_CLIENT_INPUT", "READY_FOR_INTERVIEW", "INTERVIEW_COMPLETE"].includes(state),
    interview: state === "READY_FOR_INTERVIEW" && !onboarding.currentInterviewCompletedAt,
    materialRevision: state === "DELIVERY_READY",
    transitions,
  };
}

export function blueprintSaveMessage(status, code) {
  if (status === 409 || code === "BLUEPRINT_ONBOARDING_STALE_VERSION") {
    return "This engagement changed after you opened it. Your entries are still here. Refresh the engagement, review the newer version, then submit again.";
  }
  const messages = {
    OPERATOR_SESSION_MISSING: "Sign in to use the Blueprint workspace.",
    OPERATOR_SESSION_EXPIRED: "Your operator session expired. Sign in again; your current form entries remain on this page.",
    OPERATOR_PERMISSION_MISSING: "This operator session does not have revenue-operations write permission.",
    OPERATOR_WRITE_DISABLED: "Changes are disabled in this runtime. Use the approved local operator launcher.",
    BLUEPRINT_CLIENT_AUTHORITY_UNAVAILABLE: "Client association is unavailable until the durable client authority is compatible. Leave the buyer unassociated for Ross review.",
  };
  return messages[code] || `The change was not saved${code ? ` (${code})` : ""}. Review the highlighted section and try again.`;
}
