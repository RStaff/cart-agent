import crypto from "node:crypto";

const SEVERITY_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const COMPLEXITY_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  unknown: 4,
};

const SURFACE_WEIGHT = {
  checkout_path: 50,
  cart_path: 45,
  product_page: 35,
  storefront_homepage: 30,
  capture_path: 25,
  navigation: 20,
  unknown: 0,
};

function cleanString(value = "") {
  return String(value || "").trim();
}

function slug(value = "") {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function stableId(prefix, value) {
  const hash = crypto.createHash("sha256").update(cleanString(value)).digest("hex").slice(0, 12);
  return `${prefix}_${hash}`;
}

function normalizeSeverity(value = "") {
  const clean = cleanString(value).toLowerCase();
  return SEVERITY_ORDER[clean] ? clean : "low";
}

function confidenceValue(confidence = "low") {
  switch (confidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function categoryForIssue(issue) {
  const key = `${issue.id || ""} ${issue.title || ""}`.toLowerCase();
  if (key.includes("shipping")) return "checkout_clarity";
  if (key.includes("cart")) return "cart_continuity";
  if (key.includes("checkout") || key.includes("slow")) return "checkout_path";
  if (key.includes("trust") || key.includes("reassurance")) return "purchase_reassurance";
  if (key.includes("email") || key.includes("capture")) return "lead_capture";
  if (key.includes("navigation")) return "navigation";
  if (key.includes("cta") || key.includes("visual") || key.includes("competing")) return "conversion_path";
  if (key.includes("low_signal") || key.includes("insufficient")) return "discovery";
  return "conversion_friction";
}

function affectedSurfaceForCategory(category) {
  switch (category) {
    case "checkout_clarity":
    case "checkout_path":
      return "checkout_path";
    case "cart_continuity":
      return "cart_path";
    case "purchase_reassurance":
      return "product_page";
    case "lead_capture":
      return "capture_path";
    case "navigation":
      return "navigation";
    case "conversion_path":
    case "conversion_friction":
      return "storefront_homepage";
    default:
      return "unknown";
  }
}

function complexityForCategory(category) {
  switch (category) {
    case "checkout_path":
      return "high";
    case "navigation":
    case "conversion_path":
      return "medium";
    case "discovery":
      return "unknown";
    default:
      return "low";
  }
}

function riskForComplexity(complexity) {
  switch (complexity) {
    case "high":
      return "medium";
    case "unknown":
      return "unknown";
    default:
      return "low";
  }
}

function deriveConfidence(issue) {
  const explicit = cleanString(issue.confidence).toLowerCase();
  if (["high", "medium", "low"].includes(explicit)) return explicit;

  const hasTitle = Boolean(cleanString(issue.title));
  const hasDetail = Boolean(cleanString(issue.detail || issue.evidence || issue.observedBehavior));
  const severity = normalizeSeverity(issue.severity);

  if (hasTitle && hasDetail && ["critical", "high"].includes(severity)) return "medium";
  if (hasTitle && hasDetail) return "medium";
  return "low";
}

function recommendedRepairFor(category, issue, audit) {
  const auditRecommendation = cleanString(audit.audit?.evidence?.recommendedAction);
  const issueRecommendation = cleanString(issue.recommendedRemediation || issue.recommendedAction);

  if (issueRecommendation) return issueRecommendation;

  switch (category) {
    case "checkout_clarity":
      return "Clarify shipping, delivery, or late-stage purchase expectations in the affected purchase path.";
    case "checkout_path":
      return auditRecommendation || "Review and reduce checkout-path friction before any implementation is approved.";
    case "cart_continuity":
      return "Confirm cart continuity messaging and preserve a clear path back to checkout.";
    case "purchase_reassurance":
      return "Add or reposition trust, support, return, or reassurance cues near the relevant purchase decision.";
    case "lead_capture":
      return "Confirm the capture path and add a bounded capture improvement only after operator review.";
    case "navigation":
      return "Reduce choice load around the primary shopping path without changing the broader information architecture.";
    case "conversion_path":
      return auditRecommendation || "Clarify the primary purchase action and reduce competing priorities.";
    case "discovery":
      return "Perform additional operator review before selecting a repair.";
    default:
      return auditRecommendation || "Review the stored finding and define a bounded conversion-path repair.";
  }
}

function merchantVisibleOutcomeFor(category) {
  switch (category) {
    case "checkout_clarity":
      return "Clearer purchase expectations before checkout completion.";
    case "checkout_path":
      return "Reduced friction in the checkout or purchase handoff.";
    case "cart_continuity":
      return "A clearer return path from cart context to checkout.";
    case "purchase_reassurance":
      return "More visible confidence cues near a purchase decision.";
    case "lead_capture":
      return "A clearer opt-in or contact capture path where appropriate.";
    case "navigation":
      return "Less distraction from the primary product or purchase path.";
    case "conversion_path":
      return "A clearer primary action for shoppers.";
    default:
      return "A bounded improvement tied to the stored audit evidence.";
  }
}

function implementationScopeFor(category, complexity) {
  if (category === "discovery") {
    return "No implementation scope yet; additional evidence is required.";
  }

  if (complexity === "high") {
    return "Bounded diagnostic and small targeted implementation only after operator approval.";
  }

  return "Single bounded theme/content adjustment tied to the source finding.";
}

function dependenciesFor(category, confidence) {
  const dependencies = [];
  if (confidence === "low") dependencies.push("operator_evidence_review");
  if (category === "checkout_path") dependencies.push("checkout_path_confirmation");
  if (category === "lead_capture") dependencies.push("merchant_contact_policy_confirmation");
  if (category === "navigation") dependencies.push("navigation_priority_confirmation");
  if (category === "discovery") dependencies.push("additional_storefront_evidence");
  return dependencies;
}

function verificationCriteriaFor(category) {
  switch (category) {
    case "checkout_clarity":
      return [
        "Before/after evidence shows clearer shipping or delivery language.",
        "The purchase path remains reachable after the change.",
      ];
    case "checkout_path":
      return [
        "Before/after evidence shows the targeted checkout-path friction was reduced.",
        "No checkout or payment authority changed.",
      ];
    case "cart_continuity":
      return [
        "Before/after evidence shows a clearer cart-to-checkout continuation path.",
        "No cart or Packet authority changed outside approved execution.",
      ];
    case "purchase_reassurance":
      return [
        "Before/after evidence shows reassurance cues near the relevant purchase decision.",
        "The original purchase action remains intact.",
      ];
    case "navigation":
      return [
        "Before/after evidence shows reduced choice load near the primary purchase path.",
        "Core navigation remains usable.",
      ];
    case "lead_capture":
      return [
        "Before/after evidence shows the capture path is visible or intentionally absent.",
        "No customer contact is sent by the repair plan.",
      ];
    default:
      return [
        "Operator captures before/after evidence for the targeted surface.",
        "No Shopify mutation occurs until a separate execution packet authorizes it.",
      ];
  }
}

function actionStatusFor({ category, confidence, complexity }) {
  if (category === "discovery") return "REQUIRES_ADDITIONAL_DISCOVERY";
  if (confidence === "low") return "REQUIRES_CONFIRMATION";
  if (complexity === "unknown") return "REQUIRES_ADDITIONAL_DISCOVERY";
  if (complexity === "high") return "REQUIRES_CONFIRMATION";
  return "DIRECTLY_ACTIONABLE";
}

function extractIssues(retrievedAudit) {
  const evidence = retrievedAudit?.audit?.evidence || {};
  const analysisIssues = Array.isArray(evidence.analysisSnapshot?.issues)
    ? evidence.analysisSnapshot.issues
    : [];
  const findingIssues = Array.isArray(evidence.findingsSnapshot?.issues)
    ? evidence.findingsSnapshot.issues
    : [];

  if (analysisIssues.length > 0) return analysisIssues;
  if (findingIssues.length > 0) return findingIssues;

  const topIssue = cleanString(evidence.topIssue);
  if (!topIssue) return [];

  return [{
    id: slug(topIssue) || "top_issue",
    title: topIssue,
    detail: "Only the durable audit summary is available for this finding.",
    severity: "medium",
  }];
}

function buildRepairItem({ audit, issue, sourceIndex }) {
  const title = cleanString(issue.title);
  if (!title) {
    return {
      unsupported: true,
      reason: "missing_finding_title",
    };
  }

  const sourceFindingId = cleanString(issue.id) || `${slug(title) || "finding"}_${sourceIndex + 1}`;
  const severity = normalizeSeverity(issue.severity);
  const confidence = deriveConfidence(issue);
  const category = categoryForIssue({ ...issue, title });
  const affectedSurface = affectedSurfaceForCategory(category);
  const complexity = complexityForCategory(category);
  const dependencies = dependenciesFor(category, confidence);
  const actionableStatus = actionStatusFor({ category, confidence, complexity });
  const supportingEvidence = [
    cleanString(issue.detail || issue.evidence || issue.observedBehavior),
    cleanString(audit.audit?.evidence?.findingSummary?.topIssue) === title
      ? "This is the durable audit top issue."
      : "",
  ].filter(Boolean);

  const priorityScore =
    SEVERITY_ORDER[severity] * 100 +
    confidenceValue(confidence) * 20 +
    (SURFACE_WEIGHT[affectedSurface] || 0) -
    COMPLEXITY_ORDER[complexity] * 5 -
    dependencies.length * 4;

  return {
    repairItemId: stableId("repair", `${audit.audit.id}:${sourceFindingId}`),
    sourceFindingId,
    title,
    category,
    affectedSurface,
    severity,
    priorityRank: 0,
    confidence,
    problemStatement: cleanString(issue.detail) || title,
    supportingEvidence,
    recommendedRepair: recommendedRepairFor(category, issue, audit),
    merchantVisibleOutcome: merchantVisibleOutcomeFor(category),
    implementationScope: implementationScopeFor(category, complexity),
    dependencies,
    estimatedComplexity: complexity,
    riskClassification: riskForComplexity(complexity),
    verificationCriteria: verificationCriteriaFor(category),
    rollbackExpectation:
      category === "discovery"
        ? "No rollback expectation because no implementation is eligible yet."
        : "Revert only the bounded change approved by the future execution packet.",
    eligibilityForControlledExecution: actionableStatus === "DIRECTLY_ACTIONABLE",
    actionableStatus,
    priorityScore,
  };
}

function severityCounts(items) {
  return items.reduce(
    (counts, item) => {
      counts[item.severity] += 1;
      return counts;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
}

function packetStateFor(audit) {
  const activeLink = (audit.packetLinks || []).find((link) => link.status === "active") || audit.packetLinks?.[0];
  if (!activeLink) {
    return {
      linked: false,
      packetId: null,
      packetStatus: null,
      executionStatus: null,
      proofStatus: null,
      completionStatus: null,
    };
  }

  return {
    linked: true,
    packetId: activeLink.packetId,
    packetStatus: activeLink.packet?.status || null,
    executionStatus: activeLink.packet?.executionStatus || null,
    proofStatus: activeLink.packet?.proofStatus || null,
    completionStatus: activeLink.packet?.completionStatus || null,
  };
}

export function buildShopifixerRepairPlan(retrievedAudit, options = {}) {
  if (!retrievedAudit?.audit?.id || !retrievedAudit?.audit?.normalizedShopifyDomain) {
    return {
      ok: false,
      status: 422,
      error: "insufficient_audit_evidence",
      missing: ["audit.id", "audit.normalizedShopifyDomain"],
    };
  }

  const issues = extractIssues(retrievedAudit);
  if (issues.length === 0) {
    return {
      ok: false,
      status: 422,
      error: "insufficient_audit_evidence",
      missing: ["audit.evidence.analysisSnapshot.issues"],
    };
  }

  const unsupported = [];
  const items = issues
    .map((issue, sourceIndex) => buildRepairItem({ audit: retrievedAudit, issue, sourceIndex }))
    .filter((item) => {
      if (item.unsupported) {
        unsupported.push(item);
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return a.repairItemId.localeCompare(b.repairItemId);
    })
    .map((item, index) => ({
      ...item,
      priorityRank: index + 1,
    }));

  const counts = severityCounts(items);
  const packetState = packetStateFor(retrievedAudit);
  const sourceEvidenceVersion = stableId("audit_evidence", JSON.stringify({
    auditId: retrievedAudit.audit.id,
    requestFingerprint: retrievedAudit.audit.requestFingerprint,
    completedAt: retrievedAudit.audit.completedAt,
    itemIds: items.map((item) => item.repairItemId),
  }));
  const unsupportedCount = unsupported.length + issues.length - unsupported.length - items.length;
  const actionableCount = items.filter((item) => item.actionableStatus === "DIRECTLY_ACTIONABLE").length;
  const discoveryCount = items.filter((item) => item.actionableStatus === "REQUIRES_ADDITIONAL_DISCOVERY").length;

  return {
    ok: true,
    status: 200,
    plan: {
      auditId: retrievedAudit.audit.id,
      storeDomain: retrievedAudit.audit.normalizedShopifyDomain,
      planStatus: items.length > 0 ? "ready_for_operator_review" : "insufficient_evidence",
      generatedAt: options.generatedAt || new Date().toISOString(),
      sourceAuditCompletedAt: retrievedAudit.audit.completedAt || null,
      sourceEvidenceVersion,
      totalFindingsConsidered: issues.length,
      totalRepairItems: items.length,
      criticalCount: counts.critical,
      highCount: counts.high,
      mediumCount: counts.medium,
      lowCount: counts.low,
      excludedOrUnsupportedFindingCount: unsupportedCount,
      summary: {
        headline:
          items.length > 0
            ? `Prioritized ${items.length} bounded repair item${items.length === 1 ? "" : "s"} from stored audit evidence.`
            : "No supported repair items could be derived from stored audit evidence.",
        actionableCount,
        confirmationRequiredCount: items.filter((item) => item.actionableStatus === "REQUIRES_CONFIRMATION").length,
        additionalDiscoveryCount: discoveryCount,
        revenueClaimIncluded: false,
      },
      implementationBoundary:
        "Planning only. No Shopify mutation, Packet creation, payment action, or customer communication is authorized by this plan.",
      approvalState: "operator_review_required",
      packetState,
      unsupportedFindings: unsupported.map((item) => ({ reason: item.reason })),
      repairItems: items.map(({ priorityScore, ...item }) => item),
    },
  };
}
