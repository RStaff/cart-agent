import crypto from "node:crypto";

export const SHOPIFIXER_EXECUTION_PACKET_VERSION = "shopifixer.execution_packet.v1";

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
  const hash = crypto.createHash("sha256").update(cleanString(value)).digest("hex").slice(0, 16);
  return `${prefix}_${hash}`;
}

function normalizeScope(input = {}) {
  if (input?.scope && typeof input.scope === "object") return input.scope;
  if (input?.repairScope && typeof input.repairScope === "object") return input.repairScope;
  return input;
}

function sortByPriority(items = []) {
  return [...items].sort((a, b) => {
    const aRank = Number.isFinite(Number(a.priorityRank)) ? Number(a.priorityRank) : Number.MAX_SAFE_INTEGER;
    const bRank = Number.isFinite(Number(b.priorityRank)) ? Number(b.priorityRank) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return cleanString(a.scopeItemId).localeCompare(cleanString(b.scopeItemId));
  });
}

function summarizeScopeItem(item = {}) {
  return {
    scopeItemId: item.scopeItemId,
    sourceRepairItemId: item.sourceRepairItemId || null,
    sourceFindingId: item.sourceFindingId || null,
    priorityRank: item.priorityRank ?? null,
    title: item.title,
    reason: item.reason,
    evidence: Array.isArray(item.evidence) ? item.evidence : [],
    recommendedImplementation: item.recommendedImplementation,
    estimatedComplexity: item.estimatedComplexity || "unknown",
    implementationDependency: Array.isArray(item.implementationDependency) ? item.implementationDependency : [],
    verificationCriteria: Array.isArray(item.verificationCriteria) ? item.verificationCriteria : [],
    rollbackExpectation: item.rollbackExpectation,
    actionableStatus: item.actionableStatus || null,
  };
}

function buildImplementationSequence({ packetSeed, approvedRepairs }) {
  return approvedRepairs.map((repair, index) => ({
    stepId: stableId("exec_step", `${packetSeed}:implement:${repair.scopeItemId}`),
    order: index + 1,
    scopeItemId: repair.scopeItemId,
    title: repair.title,
    authorizedAction: repair.recommendedImplementation,
    implementationDependency: repair.implementationDependency,
    expectedEvidence: repair.verificationCriteria.map((criterion, criterionIndex) => ({
      evidenceId: stableId("evidence", `${packetSeed}:${repair.scopeItemId}:${criterionIndex}:${criterion}`),
      scopeItemId: repair.scopeItemId,
      criterion,
    })),
  }));
}

function buildRollbackSequence({ packetSeed, implementationSequence }) {
  return [...implementationSequence].reverse().map((step, index) => ({
    rollbackStepId: stableId("rollback_step", `${packetSeed}:rollback:${step.stepId}`),
    order: index + 1,
    reversesStepId: step.stepId,
    scopeItemId: step.scopeItemId,
    title: step.title,
    rollbackAction: "Revert only the bounded change made for this execution step.",
    rollbackExpectation: "Return the affected surface to its pre-execution evidence state.",
  }));
}

function uniqueValues(values = []) {
  return Array.from(new Set(values.map((value) => cleanString(value)).filter(Boolean)));
}

function buildVerification({ approvedRepairs, implementationSequence }) {
  const expectedVerificationSteps = implementationSequence.flatMap((step) => step.expectedEvidence);
  return {
    expectedVerificationSteps,
    completionCriteria: [
      "Every implementation step in this packet is completed or explicitly skipped with operator approval.",
      "Required before/after evidence is captured for every completed implementation step.",
      "No Shopify surface outside this packet is changed.",
      "No Packet lifecycle, payment, webhook, or customer communication authority is changed.",
      "Operator records final verification before any merchant-facing completion claim.",
    ],
    requiredEvidence: [
      "pre_execution_scope_snapshot",
      "implementation_change_log",
      "post_execution_visual_or_behavioral_evidence",
      "rollback_readiness_note",
      "operator_completion_verification",
    ],
    repairVerificationCriteria: approvedRepairs.map((repair) => ({
      scopeItemId: repair.scopeItemId,
      title: repair.title,
      criteria: repair.verificationCriteria,
    })),
  };
}

function buildExecutionBoundary({ approvedRepairs, excludedRepairs, deferredRepairs }) {
  return {
    authorized: approvedRepairs.map((repair) => ({
      scopeItemId: repair.scopeItemId,
      title: repair.title,
      authorizedAction: repair.recommendedImplementation,
      reason: repair.reason,
    })),
    notAuthorized: [
      "Any Shopify mutation outside the approved repairs listed in this packet.",
      "Packet table creation, mutation, or lifecycle transition.",
      "Payment record creation or mutation.",
      "Webhook invocation.",
      "Customer or merchant communication.",
      "Theme redesign or broad refactor outside the approved repair items.",
    ],
    outOfScope: [
      ...excludedRepairs.map((repair) => ({
        scopeItemId: repair.scopeItemId,
        title: repair.title,
        reason: repair.inclusionReason || repair.reason,
      })),
      ...deferredRepairs.map((repair) => ({
        scopeItemId: repair.scopeItemId,
        title: repair.title,
        reason: repair.inclusionReason || repair.reason,
      })),
    ],
  };
}

export function buildShopifixerExecutionPacket(input = {}, options = {}) {
  const scope = normalizeScope(input);
  const auditId = cleanString(scope.auditId);
  const scopeId = cleanString(scope.scopeId);
  const store = cleanString(scope.store);
  const canonicalPacketId = cleanString(scope.canonicalPacketId || scope.packetState?.canonicalPacketId);
  const scopeFingerprint = cleanString(scope.scopeFingerprint);
  const durableApprovalId = cleanString(scope.approvalModel?.durableApprovalId || scope.approvalId);

  if (!auditId || !scopeId || !store) {
    return {
      ok: false,
      status: 422,
      error: "insufficient_repair_scope_evidence",
      missing: ["repairScope.auditId", "repairScope.scopeId", "repairScope.store"],
    };
  }

  if (scope.approvalStatus !== "APPROVED") {
    return {
      ok: false,
      status: 409,
      error: "repair_scope_not_approved",
    };
  }

  if (scope.executionReadiness !== "READY") {
    return {
      ok: false,
      status: 409,
      error: "repair_scope_not_execution_ready",
    };
  }

  const approvedRepairs = sortByPriority(scope.includedRepairs || []).map(summarizeScopeItem);
  if (approvedRepairs.length === 0) {
    return {
      ok: false,
      status: 422,
      error: "repair_scope_has_no_approved_repairs",
    };
  }

  const excludedRepairs = sortByPriority(scope.excludedRepairs || []).map(summarizeScopeItem);
  const deferredRepairs = sortByPriority(scope.deferredRepairs || []).map(summarizeScopeItem);
  const packetSeed = stableStringify({
    manifestVersion: SHOPIFIXER_EXECUTION_PACKET_VERSION,
    auditId,
    scopeId,
    store,
    canonicalPacketId: canonicalPacketId || null,
    durableApprovalId: durableApprovalId || null,
    scopeFingerprint: scopeFingerprint || null,
    approvedRepairs: approvedRepairs.map((repair) => repair.scopeItemId),
  });
  const manifestId = stableId("shopifixer_exec_manifest", packetSeed);
  const generatedAt =
    cleanString(options.generatedAt) ||
    cleanString(scope.generatedAt) ||
    cleanString(scope.sourceAuditCompletedAt);
  const implementationSequence = buildImplementationSequence({ packetSeed, approvedRepairs });
  const rollbackSequence = buildRollbackSequence({ packetSeed, implementationSequence });
  const verification = buildVerification({ approvedRepairs, implementationSequence });

  return {
    ok: true,
    status: 200,
    packet: {
      manifestId,
      canonicalPacketId: canonicalPacketId || null,
      auditId,
      scopeId,
      approvalId: durableApprovalId || null,
      scopeFingerprint: scopeFingerprint || null,
      merchant: {
        store,
      },
      generatedAt,
      manifestVersion: SHOPIFIXER_EXECUTION_PACKET_VERSION,
      packetStatus: scope.packetState?.packetStatus || "PLANNING_ONLY",
      executionStatus: scope.packetState?.executionStatus || null,
      proofStatus: scope.packetState?.proofStatus || null,
      completionStatus: scope.packetState?.completionStatus || null,
      executionBoundary: buildExecutionBoundary({ approvedRepairs, excludedRepairs, deferredRepairs }),
      approvedRepairs,
      excludedRepairs,
      deferredRepairs,
      assumptions: Array.isArray(scope.implementationAssumptions) ? scope.implementationAssumptions : [],
      dependencies: uniqueValues([
        ...(Array.isArray(scope.implementationDependencies) ? scope.implementationDependencies : []),
        ...approvedRepairs.flatMap((repair) => repair.implementationDependency),
      ]),
      implementationSequence,
      rollbackSequence,
      verification,
      authority: {
        approvalState: scope.approvalStatus,
        durableApprovalId: durableApprovalId || null,
        canonicalPacketId: canonicalPacketId || null,
        authorityConditions: scope.authorityConditions || options.authority?.conditions || null,
        authorityFailedConditions: scope.authorityFailedConditions || options.authority?.failedConditions || [],
        operatorAuthorization: {
          status: options.operatorAuthorized === true
            ? "OPERATOR_AUTHORIZATION_RECORDED"
            : "OPERATOR_AUTHORIZATION_REQUIRED_BEFORE_EXECUTION",
          source: cleanString(options.operatorAuthorizationSource) || null,
        },
        executionReadiness: scope.executionReadiness,
        currentMissionExecutionAuthorized: false,
        futureExecutionRequires: [
          "separately governed execution mission",
          "this packet ID",
          "operator authorization",
          "before evidence capture",
          "rollback readiness",
        ],
      },
    },
  };
}
