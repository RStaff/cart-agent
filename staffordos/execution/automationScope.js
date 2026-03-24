const ALLOWED_AUTOMATION_TYPES = new Set([
  "abandoned_cart_email_send",
  "email_send",
  "sms_recovery",
  "timing_optimization",
  "basic_ab_test",
]);

const FORCED_HUMAN_TYPES = new Set([
  "pricing_change",
  "checkout_ux_change",
  "major_funnel_rewrite",
  "irreversible_action",
]);

function normalizeActionType(opportunity = {}) {
  return String(
    opportunity?.actionType
      ?? opportunity?.action_type
      ?? opportunity?.changeType
      ?? opportunity?.optimizationType
      ?? opportunity?.proposedActionType
      ?? "",
  )
    .trim()
    .toLowerCase();
}

export function enforceAutomationScope(opportunity = {}, resolved = {}) {
  const actionType = normalizeActionType(opportunity);
  const reasons = Array.isArray(resolved?.reasons) ? [...resolved.reasons] : [];

  if (!actionType) {
    return {
      ...resolved,
      reasons,
      actionType,
      scopeStatus: "NO_SCOPE_OVERRIDE",
    };
  }

  if (FORCED_HUMAN_TYPES.has(actionType)) {
    reasons.push(`Action type "${actionType}" is restricted to human-required execution.`);
    return {
      ...resolved,
      decision: "ESCALATE",
      executionMode: "HUMAN_REQUIRED",
      reasons,
      actionType,
      scopeStatus: "FORCED_HUMAN_REQUIRED",
    };
  }

  if (resolved?.executionMode === "AUTO" || resolved?.executionMode === "HYBRID") {
    if (!ALLOWED_AUTOMATION_TYPES.has(actionType)) {
      reasons.push(`Action type "${actionType}" is outside the allowed automation scope.`);
      return {
        ...resolved,
        decision: "ESCALATE",
        executionMode: "HUMAN_REQUIRED",
        reasons,
        actionType,
        scopeStatus: "FORCED_HUMAN_REQUIRED",
      };
    }
  }

  reasons.push(`Action type "${actionType}" is allowed for ${resolved.executionMode} execution.`);
  return {
    ...resolved,
    reasons,
    actionType,
    scopeStatus: "ALLOWED",
  };
}
