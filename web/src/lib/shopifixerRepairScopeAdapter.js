import crypto from "node:crypto";

export const REPAIR_SCOPE_APPROVAL_STATES = Object.freeze([
  "DRAFT",
  "READY_FOR_REVIEW",
  "READY_FOR_MERCHANT_APPROVAL",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);

export const REPAIR_SCOPE_EXECUTION_READINESS = Object.freeze([
  "READY",
  "BLOCKED",
  "REQUIRES_CONFIRMATION",
  "REQUIRES_DISCOVERY",
]);

export const REPAIR_SCOPE_APPROVAL_TRANSITIONS = Object.freeze({
  DRAFT: Object.freeze(["READY_FOR_REVIEW", "REJECTED", "EXPIRED"]),
  READY_FOR_REVIEW: Object.freeze(["DRAFT", "READY_FOR_MERCHANT_APPROVAL", "REJECTED", "EXPIRED"]),
  READY_FOR_MERCHANT_APPROVAL: Object.freeze(["APPROVED", "REJECTED", "EXPIRED"]),
  APPROVED: Object.freeze(["EXPIRED"]),
  REJECTED: Object.freeze(["DRAFT"]),
  EXPIRED: Object.freeze(["DRAFT"]),
});

const COMPLEXITY_POINTS = {
  low: 1,
  medium: 2,
  high: 3,
  unknown: 4,
};

function cleanString(value = "") {
  return String(value || "").trim();
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function stableId(prefix, value) {
  const hash = crypto.createHash("sha256").update(cleanString(value)).digest("hex").slice(0, 12);
  return `${prefix}_${hash}`;
}

function sortedIds(items = []) {
  return items.map((item) => cleanString(item.scopeItemId)).filter(Boolean).sort();
}

function normalizeScopeVersion(value = 1) {
  const version = Number(value || 1);
  return Number.isInteger(version) && version > 0 ? version : null;
}

function normalizeApprovalStatus(value = "") {
  const clean = cleanString(value).toUpperCase();
  if (!clean) return "READY_FOR_REVIEW";
  return REPAIR_SCOPE_APPROVAL_STATES.includes(clean) ? clean : null;
}

function normalizeRepairPlan(input = {}) {
  if (input?.plan && typeof input.plan === "object") return input.plan;
  if (input?.repairPlan && typeof input.repairPlan === "object") return input.repairPlan;
  return input;
}

function dispositionForRepairItem(item = {}) {
  switch (item.actionableStatus) {
    case "DIRECTLY_ACTIONABLE":
      return "INCLUDED";
    case "REQUIRES_CONFIRMATION":
    case "REQUIRES_ADDITIONAL_DISCOVERY":
      return "DEFERRED";
    case "NOT_ELIGIBLE_FOR_EXECUTION":
      return "EXCLUDED";
    default:
      return item.eligibilityForControlledExecution ? "INCLUDED" : "DEFERRED";
  }
}

function inclusionReasonFor(item = {}, disposition) {
  if (disposition === "INCLUDED") {
    return "Stored audit evidence supports a bounded implementation candidate.";
  }

  if (item.actionableStatus === "REQUIRES_ADDITIONAL_DISCOVERY") {
    return "Deferred because stored evidence requires additional discovery before execution.";
  }

  if (item.actionableStatus === "REQUIRES_CONFIRMATION") {
    return "Deferred until operator or merchant confirmation clears the implementation dependency.";
  }

  return "Excluded from this repair scope because it is not eligible for controlled execution.";
}

function scopeItemFromRepairItem({ auditId, item }) {
  const disposition = dispositionForRepairItem(item);
  return {
    scopeItemId: stableId("scope_item", `${auditId}:${item.repairItemId}`),
    sourceRepairItemId: item.repairItemId,
    sourceFindingId: item.sourceFindingId,
    priorityRank: item.priorityRank,
    title: item.title,
    reason: item.problemStatement || item.title,
    evidence: Array.isArray(item.supportingEvidence) ? item.supportingEvidence : [],
    recommendedImplementation: item.recommendedRepair,
    estimatedComplexity: item.estimatedComplexity || "unknown",
    implementationDependency: Array.isArray(item.dependencies) ? item.dependencies : [],
    verificationCriteria: Array.isArray(item.verificationCriteria) ? item.verificationCriteria : [],
    rollbackExpectation: item.rollbackExpectation,
    included: disposition === "INCLUDED",
    excluded: disposition === "EXCLUDED",
    scopeDisposition: disposition,
    inclusionReason: inclusionReasonFor(item, disposition),
    actionableStatus: item.actionableStatus || "REQUIRES_CONFIRMATION",
    merchantNotes: "",
  };
}

function scopeItemFromUnsupportedFinding({ auditId, item = {}, index }) {
  const reason = cleanString(item.reason) || "unsupported_finding";
  return {
    scopeItemId: stableId("scope_item", `${auditId}:unsupported:${index}:${reason}`),
    sourceRepairItemId: null,
    sourceFindingId: null,
    priorityRank: null,
    title: "Unsupported audit finding",
    reason,
    evidence: [],
    recommendedImplementation: "Excluded from this repair scope until stored evidence supports a bounded repair.",
    estimatedComplexity: "unknown",
    implementationDependency: ["operator_evidence_review"],
    verificationCriteria: [
      "Operator confirms whether this finding should become a future repair item.",
    ],
    rollbackExpectation: "No rollback expectation because no implementation is included.",
    included: false,
    excluded: true,
    scopeDisposition: "EXCLUDED",
    inclusionReason: "Excluded because the stored audit finding is unsupported by the repair-plan contract.",
    actionableStatus: "NOT_ELIGIBLE_FOR_EXECUTION",
    merchantNotes: "",
  };
}

function estimateImplementationSize(includedRepairs = []) {
  const total = includedRepairs.reduce((sum, item) => {
    return sum + (COMPLEXITY_POINTS[item.estimatedComplexity] || COMPLEXITY_POINTS.unknown);
  }, 0);

  if (total === 0) return "none";
  if (total <= 2) return "small";
  if (total <= 5) return "medium";
  return "large";
}

function classifyExecutionReadiness({ approvalStatus, includedRepairs, deferredRepairs, excludedRepairs }) {
  if (approvalStatus === "REJECTED" || approvalStatus === "EXPIRED") {
    return {
      executionReadiness: "BLOCKED",
      executionReadinessReasons: [`approval_status_${approvalStatus.toLowerCase()}`],
    };
  }

  if (includedRepairs.length === 0) {
    const hasDiscovery = deferredRepairs.some((item) => item.actionableStatus === "REQUIRES_ADDITIONAL_DISCOVERY");
    const hasConfirmation = deferredRepairs.some((item) => item.actionableStatus === "REQUIRES_CONFIRMATION");
    return {
      executionReadiness: hasDiscovery ? "REQUIRES_DISCOVERY" : hasConfirmation ? "REQUIRES_CONFIRMATION" : "BLOCKED",
      executionReadinessReasons: hasDiscovery
        ? ["no_included_repairs", "additional_discovery_required"]
        : hasConfirmation
          ? ["no_included_repairs", "confirmation_required"]
        : ["no_included_repairs"],
    };
  }

  if (approvalStatus !== "APPROVED") {
    return {
      executionReadiness: "REQUIRES_CONFIRMATION",
      executionReadinessReasons: ["merchant_or_operator_approval_required"],
    };
  }

  return {
    executionReadiness: "READY",
    executionReadinessReasons: [],
  };
}

function buildApprovalModel(approvalStatus) {
  return {
    status: approvalStatus,
    allowedStates: [...REPAIR_SCOPE_APPROVAL_STATES],
    allowedTransitions: [...(REPAIR_SCOPE_APPROVAL_TRANSITIONS[approvalStatus] || [])],
  };
}

export function canTransitionRepairScopeApproval(fromStatus, toStatus) {
  const from = normalizeApprovalStatus(fromStatus);
  const to = normalizeApprovalStatus(toStatus);

  if (!from || !to) {
    return {
      ok: false,
      error: "invalid_repair_scope_approval_state",
      from: fromStatus,
      to: toStatus,
    };
  }

  return {
    ok: true,
    from,
    to,
    allowed: (REPAIR_SCOPE_APPROVAL_TRANSITIONS[from] || []).includes(to),
  };
}

export function buildShopifixerRepairScope(input = {}, options = {}) {
  const repairPlan = normalizeRepairPlan(input);
  const auditId = cleanString(repairPlan.auditId);
  const storeDomain = cleanString(repairPlan.storeDomain);

  if (!auditId || !storeDomain) {
    return {
      ok: false,
      status: 422,
      error: "insufficient_repair_plan_evidence",
      missing: ["repairPlan.auditId", "repairPlan.storeDomain"],
    };
  }

  const approvalStatus = normalizeApprovalStatus(options.approvalStatus || input.approvalStatus);
  if (!approvalStatus) {
    return {
      ok: false,
      status: 400,
      error: "invalid_repair_scope_approval_state",
    };
  }

  const scopeVersion = normalizeScopeVersion(options.scopeVersion || input.scopeVersion || 1);
  if (!scopeVersion) {
    return {
      ok: false,
      status: 400,
      error: "invalid_repair_scope_version",
    };
  }

  const generatedAt =
    cleanString(options.generatedAt) ||
    cleanString(repairPlan.sourceAuditCompletedAt) ||
    cleanString(repairPlan.generatedAt);
  const repairItems = Array.isArray(repairPlan.repairItems) ? repairPlan.repairItems : [];
  const unsupportedFindings = Array.isArray(repairPlan.unsupportedFindings) ? repairPlan.unsupportedFindings : [];
  const scopeItems = [
    ...repairItems.map((item) => scopeItemFromRepairItem({ auditId, item })),
    ...unsupportedFindings.map((item, index) => scopeItemFromUnsupportedFinding({ auditId, item, index })),
  ];
  const includedRepairs = scopeItems.filter((item) => item.scopeDisposition === "INCLUDED");
  const excludedRepairs = scopeItems.filter((item) => item.scopeDisposition === "EXCLUDED");
  const deferredRepairs = scopeItems.filter((item) => item.scopeDisposition === "DEFERRED");
  const readiness = classifyExecutionReadiness({
    approvalStatus,
    includedRepairs,
    deferredRepairs,
    excludedRepairs,
  });
  const scopeId = stableId("scope", stableStringify({
    auditId,
    storeDomain,
    scopeVersion,
    sourceEvidenceVersion: repairPlan.sourceEvidenceVersion || null,
    included: sortedIds(includedRepairs),
    deferred: sortedIds(deferredRepairs),
    excluded: sortedIds(excludedRepairs),
  }));

  return {
    ok: true,
    status: 200,
    scope: {
      auditId,
      store: storeDomain,
      scopeId,
      scopeVersion,
      generatedAt,
      sourceEvidenceVersion: repairPlan.sourceEvidenceVersion || null,
      sourceAuditCompletedAt: repairPlan.sourceAuditCompletedAt || null,
      totalFindings: Number(repairPlan.totalFindingsConsidered || scopeItems.length),
      totalRepairItems: scopeItems.length,
      includedRepairCount: includedRepairs.length,
      excludedRepairCount: excludedRepairs.length,
      deferredRepairCount: deferredRepairs.length,
      includedRepairs,
      excludedRepairs,
      deferredRepairs,
      estimatedImplementationSize: estimateImplementationSize(includedRepairs),
      approvalStatus,
      approvalModel: buildApprovalModel(approvalStatus),
      executionReadiness: readiness.executionReadiness,
      executionReadinessReasons: readiness.executionReadinessReasons,
      implementationAssumptions: [
        "Scope is derived from stored durable audit evidence.",
        "No Shopify mutation is authorized by this scope.",
        "Packet creation requires a separately governed execution packet.",
      ],
      implementationDependencies: Array.from(new Set(includedRepairs.flatMap((item) => item.implementationDependency))),
      notInScope: [
        "Shopify mutation",
        "Packet creation",
        "Payment action",
        "Webhook invocation",
        "Customer communication",
        "Unbounded redesign",
      ],
      packetState: repairPlan.packetState || {
        linked: false,
        packetId: null,
        packetStatus: null,
        executionStatus: null,
        proofStatus: null,
        completionStatus: null,
      },
    },
  };
}
