import type { StaffordOsWorkspaceId } from "./workspaceRegistry";

export type StaffordOsLearningSource =
  | "repository_backed"
  | "operator_recorded"
  | "mission_derived"
  | "proof_derived"
  | "provider_derived"
  | "customer_derived"
  | "ai_proposed"
  | "imported"
  | "planned_example"
  | "needs_verification";

export type StaffordOsLearningAuthority =
  | "confirmed_by_owner"
  | "confirmed_through_governed_review"
  | "historical_operating_lesson"
  | "recommendation_only"
  | "policy_candidate"
  | "needs_authority_review";

export type StaffordOsLearningStatus =
  | "proposed_lesson"
  | "confirmed_lesson"
  | "needs_more_evidence"
  | "limited_use"
  | "superseded"
  | "rejected";

export type StaffordOsLearningConfidence = "high" | "medium" | "low" | "needs_more_evidence";

export type StaffordOsLearning = {
  id: string;
  workspaceId: StaffordOsWorkspaceId;
  missionId: string;
  objectiveId: string;
  decisionId: string;
  actionId: string;
  proofIds: string[];
  title: string;
  operatorFacingSummary: string;
  situation: string;
  observedOutcome: string;
  lesson: string;
  applicability: string;
  nonApplicability: string;
  confidenceClassification: StaffordOsLearningConfidence;
  sourceClassification: StaffordOsLearningSource;
  authorityClassification: StaffordOsLearningAuthority;
  status: StaffordOsLearningStatus;
  owner: string;
  reviewedBy: string;
  sourceArtifacts: string[];
  relatedCapabilities: string[];
  futureUse: string;
  privacyClassification: string;
  visibility: string;
  supersedes: string[];
  supersededBy: string | null;
  policyCandidate: boolean;
  notes: string;
};

export const LEARNING_SOURCE_LABELS: Record<StaffordOsLearningSource, string> = {
  repository_backed: "Repository-backed",
  operator_recorded: "Operator-recorded",
  mission_derived: "Mission-derived",
  proof_derived: "Proof-derived",
  provider_derived: "Provider-derived",
  customer_derived: "Customer-derived",
  ai_proposed: "AI-proposed",
  imported: "Imported",
  planned_example: "Planned example",
  needs_verification: "Needs verification",
};

export const LEARNING_AUTHORITY_LABELS: Record<StaffordOsLearningAuthority, string> = {
  confirmed_by_owner: "Confirmed by owner",
  confirmed_through_governed_review: "Confirmed through governed review",
  historical_operating_lesson: "Historical operating lesson",
  recommendation_only: "Recommendation only",
  policy_candidate: "Policy candidate",
  needs_authority_review: "Needs authority review",
};

export const LEARNING_STATUS_LABELS: Record<StaffordOsLearningStatus, string> = {
  proposed_lesson: "Proposed lesson",
  confirmed_lesson: "Confirmed lesson",
  needs_more_evidence: "Needs more evidence",
  limited_use: "Limited use",
  superseded: "Superseded",
  rejected: "Rejected",
};

export const LEARNING_CONFIDENCE_LABELS: Record<StaffordOsLearningConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  needs_more_evidence: "Needs more evidence",
};

export const STAFFORDOS_LEARNING: StaffordOsLearning[] = [
  {
    id: "learning-os-grows-beside-operator",
    workspaceId: "stafford-media",
    missionId: "s008-foundation",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "start-my-day-home-action",
    proofIds: ["proof-start-my-day-route-available"],
    title: "/os can grow beside the current operator pages",
    operatorFacingSummary: "The new StaffordOS shell can guide Ross back to the current working page without replacing it too early.",
    situation: "/os is still read-only and /operator remains the working source for real Stafford Media operations.",
    observedOutcome: "/operator returned HTTP 200 while /os stayed a presentation shell.",
    lesson: "Incremental /os work should point to current operator truth until parity is proven.",
    applicability: "Applies to future /os shell, Home, and navigation work that needs to reuse existing operating pages.",
    nonApplicability: "Does not authorize route moves, redirects, data-loader imports, write actions, or /operator replacement.",
    confidenceClassification: "high",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_operating_lesson",
    status: "confirmed_lesson",
    owner: "Ross / Stafford Media",
    reviewedBy: "S008 local checkpoint",
    sourceArtifacts: [
      "staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md",
      "staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md",
      "staffordos/architecture/S008_12_PROOF_FOUNDATION_AND_OUTCOME_VERIFICATION.md",
    ],
    relatedCapabilities: ["start-my-day", "decide-what-matters"],
    futureUse: "Use this when deciding whether a new /os page should link to, wrap, or wait for existing /operator truth.",
    privacyClassification: "Owner-private Stafford Media learning.",
    visibility: "Visible inside Stafford Media /os learning surfaces.",
    supersedes: [],
    supersededBy: null,
    policyCandidate: false,
    notes: "This is a narrow architecture lesson. It is not a policy and does not change routing authority.",
  },
  {
    id: "learning-capability-links-avoid-data-duplication",
    workspaceId: "stafford-media",
    missionId: "s008-capability-map",
    objectiveId: "stafford-media-convert-opportunities",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-people-to-contact-action",
    proofIds: ["proof-people-to-contact-route-available"],
    title: "Capability links should avoid copying operating data",
    operatorFacingSummary: "The capability map is safest when it opens the current working page instead of recreating lead data in /os.",
    situation: "The people-to-contact capability has an existing authoritative /operator page.",
    observedOutcome: "/operator/leads returned HTTP 200 during validation without adding an /os data loader.",
    lesson: "Use read-only links to current operating pages before duplicating lead, campaign, revenue, or delivery surfaces.",
    applicability: "Applies to Stafford Media capability-map and action-list links that already have authoritative /operator routes.",
    nonApplicability: "Does not apply to future pages that have passed parity and governance checks, and does not authorize importing write-capable loaders.",
    confidenceClassification: "high",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_operating_lesson",
    status: "confirmed_lesson",
    owner: "Ross / Stafford Media",
    reviewedBy: "S008 local checkpoint",
    sourceArtifacts: [
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
      "staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.md",
      "staffordos/architecture/S008_12_PROOF_FOUNDATION_AND_OUTCOME_VERIFICATION.md",
    ],
    relatedCapabilities: ["find-people-to-contact"],
    futureUse: "Use this when adding new capability links so /os remains a map over working truth instead of a duplicate data surface.",
    privacyClassification: "Owner-private Stafford Media learning.",
    visibility: "Visible inside Stafford Media /os learning surfaces.",
    supersedes: [],
    supersededBy: null,
    policyCandidate: false,
    notes: "This lesson is about presentation architecture only. It does not evaluate outreach results.",
  },
  {
    id: "learning-revenue-language-stays-authority-bound",
    workspaceId: "stafford-media",
    missionId: "s008-capability-map",
    objectiveId: "stafford-media-convert-opportunities",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-money-to-collect-action",
    proofIds: ["proof-money-to-collect-route-available"],
    title: "Money-related pages need narrow result language",
    operatorFacingSummary: "Opening a revenue page proves the page is available, not that money was collected.",
    situation: "The money-to-collect Action links to an existing revenue page without claiming payment or revenue outcomes.",
    observedOutcome: "/operator/revenue-command returned HTTP 200 during validation.",
    lesson: "Revenue-facing StaffordOS language must separate route availability, expected payment follow-up, captured revenue, and verified payment.",
    applicability: "Applies to future Stafford Media revenue, payment, and opportunity-copy surfaces.",
    nonApplicability: "Does not prove payment, pricing, conversion, Stripe state, customer intent, or captured revenue.",
    confidenceClassification: "high",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_operating_lesson",
    status: "confirmed_lesson",
    owner: "Ross / Stafford Media",
    reviewedBy: "S008 local checkpoint",
    sourceArtifacts: [
      "staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.md",
      "staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.md",
      "staffordos/architecture/S008_12_PROOF_FOUNDATION_AND_OUTCOME_VERIFICATION.md",
    ],
    relatedCapabilities: ["see-money-to-collect"],
    futureUse: "Use this when writing money-related next actions so StaffordOS does not overstate business results.",
    privacyClassification: "Owner-private Stafford Media learning.",
    visibility: "Visible inside Stafford Media /os learning surfaces.",
    supersedes: [],
    supersededBy: null,
    policyCandidate: false,
    notes: "This is a language and proof-scope lesson, not a payment policy.",
  },
  {
    id: "learning-active-work-proof-scope-stays-narrow",
    workspaceId: "stafford-media",
    missionId: "s008-proof-foundation",
    objectiveId: "stafford-media-complete-work-with-proof",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-active-work-action",
    proofIds: ["proof-active-work-route-available"],
    title: "Proof scope must stay narrow for customer work",
    operatorFacingSummary: "A working active-work page does not prove that customer work is complete.",
    situation: "The active-work Action links to the current customer-work surface while S008 remains read-only.",
    observedOutcome: "/operator/command-center returned HTTP 200 during validation.",
    lesson: "Proof records should state exactly what was observed and avoid turning page availability into delivery completion.",
    applicability: "Applies to ShopiFixer, Abando, and Stafford Media work surfaces where proof may later support completion claims.",
    nonApplicability: "Does not prove customer delivery, merchant approval, before-and-after evidence, QA, or customer success outcomes.",
    confidenceClassification: "high",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_operating_lesson",
    status: "confirmed_lesson",
    owner: "Ross / Stafford Media",
    reviewedBy: "S008 local checkpoint",
    sourceArtifacts: [
      "staffordos/architecture/S008_11_EVIDENCE_FOUNDATION.md",
      "staffordos/architecture/S008_12_PROOF_FOUNDATION_AND_OUTCOME_VERIFICATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/proofFoundation.ts",
    ],
    relatedCapabilities: ["manage-current-customer-work"],
    futureUse: "Use this when designing proof, completion, and customer-success surfaces so StaffordOS preserves trustworthy claims.",
    privacyClassification: "Owner-private Stafford Media learning.",
    visibility: "Visible inside Stafford Media /os learning surfaces.",
    supersedes: [],
    supersededBy: null,
    policyCandidate: false,
    notes: "This may inform a future playbook, but it is not promoted to policy here.",
  },
  {
    id: "learning-objectives-need-explicit-alignment",
    workspaceId: "stafford-media",
    missionId: "s008-objective-registry",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-current-objectives-action",
    proofIds: ["proof-current-goals-static-tests-passed"],
    title: "Actions need explicit goal alignment",
    operatorFacingSummary: "StaffordOS should show which goal an action supports instead of inferring it from a title.",
    situation: "S008.08 added static Stafford Media objectives and S008.10 linked Actions to Objectives by explicit IDs.",
    observedOutcome: "Objective Registry tests passed and /os/objectives returned HTTP 200 during validation.",
    lesson: "Future action priority should depend on explicit objective alignment, not title matching or hidden assumptions.",
    applicability: "Applies to future Action, Objective, Home, and priority-presentation work.",
    nonApplicability: "Does not provide live measurement, objective completion, AI ranking, or automatic prioritization.",
    confidenceClassification: "high",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_operating_lesson",
    status: "confirmed_lesson",
    owner: "Ross / Stafford Media",
    reviewedBy: "S008 local checkpoint",
    sourceArtifacts: [
      "staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md",
      "staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.md",
      "staffordos/architecture/S008_12_PROOF_FOUNDATION_AND_OUTCOME_VERIFICATION.md",
    ],
    relatedCapabilities: ["decide-what-matters", "review-rules-and-checks"],
    futureUse: "Use this when building the future priority model and avoiding unsupported action ranking.",
    privacyClassification: "Owner-private Stafford Media learning.",
    visibility: "Visible inside Stafford Media /os learning surfaces.",
    supersedes: [],
    supersededBy: null,
    policyCandidate: false,
    notes: "This lesson supports future interpretation. It does not alter current Action order.",
  },
  {
    id: "learning-decision-memory-preserves-why",
    workspaceId: "stafford-media",
    missionId: "s008-decision-memory",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-recent-decisions-action",
    proofIds: ["proof-recent-decisions-static-tests-passed"],
    title: "Decision memory should preserve why before direction changes",
    operatorFacingSummary: "Before changing StaffordOS, Ross should be able to see what was chosen and why.",
    situation: "S008.09 added read-only decision memory, and S008.12 proved the decision page validated locally.",
    observedOutcome: "Decision Registry tests passed and /os/decisions returned HTTP 200 during validation.",
    lesson: "Future changes should consult decision memory before replacing routes, labels, boundaries, or authority assumptions.",
    applicability: "Applies to future architecture, UI, and operating-model changes that could conflict with established S008 choices.",
    nonApplicability: "Does not approve new work, execute Actions, or rewrite historical reasoning.",
    confidenceClassification: "high",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_operating_lesson",
    status: "confirmed_lesson",
    owner: "Ross / Stafford Media",
    reviewedBy: "S008 local checkpoint",
    sourceArtifacts: [
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.md",
      "staffordos/architecture/S008_12_PROOF_FOUNDATION_AND_OUTCOME_VERIFICATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts",
    ],
    relatedCapabilities: ["review-recent-activity", "understand-system-connections"],
    futureUse: "Use this when deciding whether a new implementation slice conflicts with prior architecture choices.",
    privacyClassification: "Owner-private Stafford Media learning.",
    visibility: "Visible inside Stafford Media /os learning surfaces.",
    supersedes: [],
    supersededBy: null,
    policyCandidate: false,
    notes: "This is institutional memory for architecture decisions, not approval authority.",
  },
];

export function getLearningForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return STAFFORDOS_LEARNING.filter((learning) => learning.workspaceId === workspaceId);
}

export function getLearningForMission(missionId: string) {
  return STAFFORDOS_LEARNING.filter((learning) => learning.missionId === missionId);
}

export function getLearningForObjective(objectiveId: string) {
  return STAFFORDOS_LEARNING.filter((learning) => learning.objectiveId === objectiveId);
}

export function getLearningForDecision(decisionId: string) {
  return STAFFORDOS_LEARNING.filter((learning) => learning.decisionId === decisionId);
}

export function getLearningForAction(actionId: string) {
  return STAFFORDOS_LEARNING.filter((learning) => learning.actionId === actionId);
}

export function getLearningForProof(proofId: string) {
  return STAFFORDOS_LEARNING.filter((learning) => learning.proofIds.includes(proofId));
}

export function getLearningById(learningId: string | null | undefined) {
  return STAFFORDOS_LEARNING.find((learning) => learning.id === learningId) || null;
}

export function getConfirmedLearningForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return getLearningForWorkspace(workspaceId).filter(
    (learning) =>
      learning.status === "confirmed_lesson" &&
      learning.sourceClassification !== "planned_example" &&
      learning.sourceClassification !== "ai_proposed",
  );
}

export function getLearningNeedingEvidence(workspaceId: StaffordOsWorkspaceId) {
  return getLearningForWorkspace(workspaceId).filter((learning) => learning.status === "needs_more_evidence");
}

export function getApplicableLearningForCapability(capabilityId: string) {
  return STAFFORDOS_LEARNING.filter((learning) => learning.relatedCapabilities.includes(capabilityId));
}
