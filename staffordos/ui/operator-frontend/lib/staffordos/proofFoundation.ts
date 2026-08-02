import type { StaffordOsWorkspaceId } from "./workspaceRegistry";

export type StaffordOsProofType = "route_check" | "test_result" | "build_result" | "workspace_boundary" | "architecture_certification";

export type StaffordOsProofSource =
  | "repository_backed"
  | "provider_confirmed"
  | "operator_confirmed"
  | "customer_confirmed"
  | "system_observed"
  | "imported"
  | "ai_summarized"
  | "planned_example"
  | "needs_verification";

export type StaffordOsProofAuthority =
  | "verified_by_operator"
  | "verified_by_governed_system"
  | "verified_by_external_provider"
  | "historical_certification"
  | "supporting_evidence_only"
  | "needs_authority_review";

export type StaffordOsProofStatus =
  | "proof_available"
  | "partially_proven"
  | "not_yet_proven"
  | "needs_review"
  | "verified"
  | "rejected";

export type StaffordOsProofConfidence = "high" | "medium" | "low" | "needs_review";

export type StaffordOsProofLearningStatus = "lesson_recorded" | "ready_for_learning" | "learning_not_connected" | "needs_review";

export type StaffordOsProof = {
  id: string;
  workspaceId: StaffordOsWorkspaceId;
  objectiveId: string;
  decisionId: string;
  actionId: string;
  title: string;
  summary: string;
  proofType: StaffordOsProofType;
  sourceClassification: StaffordOsProofSource;
  authorityClassification: StaffordOsProofAuthority;
  expectedResult: string;
  observedOutcome: string;
  verificationStatus: StaffordOsProofStatus;
  verifiedBy: string;
  verifiedAt: string;
  evidenceReferences: string[];
  sourceArtifacts: string[];
  confidenceClassification: StaffordOsProofConfidence;
  privacyClassification: string;
  visibility: string;
  notes: string;
  learningStatus: StaffordOsProofLearningStatus;
};

export const PROOF_TYPE_LABELS: Record<StaffordOsProofType, string> = {
  route_check: "Route check",
  test_result: "Test result",
  build_result: "Build result",
  workspace_boundary: "Workspace boundary",
  architecture_certification: "Architecture certification",
};

export const PROOF_SOURCE_LABELS: Record<StaffordOsProofSource, string> = {
  repository_backed: "Repository-backed",
  provider_confirmed: "Provider-confirmed",
  operator_confirmed: "Operator-confirmed",
  customer_confirmed: "Customer-confirmed",
  system_observed: "System-observed",
  imported: "Imported",
  ai_summarized: "AI-summarized",
  planned_example: "Planned example",
  needs_verification: "Needs verification",
};

export const PROOF_AUTHORITY_LABELS: Record<StaffordOsProofAuthority, string> = {
  verified_by_operator: "Verified by operator",
  verified_by_governed_system: "Verified by governed system",
  verified_by_external_provider: "Verified by external provider",
  historical_certification: "Historical certification",
  supporting_evidence_only: "Supporting evidence only",
  needs_authority_review: "Needs authority review",
};

export const PROOF_VERIFICATION_LABELS: Record<StaffordOsProofStatus, string> = {
  proof_available: "Proof available",
  partially_proven: "Partially proven",
  not_yet_proven: "Not yet proven",
  needs_review: "Needs review",
  verified: "Verified",
  rejected: "Rejected",
};

export const PROOF_CONFIDENCE_LABELS: Record<StaffordOsProofConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  needs_review: "Needs review",
};

export const PROOF_LEARNING_LABELS: Record<StaffordOsProofLearningStatus, string> = {
  lesson_recorded: "Lesson recorded",
  ready_for_learning: "Ready for future learning",
  learning_not_connected: "Learning not connected yet",
  needs_review: "Needs review",
};

export const STAFFORDOS_PROOF: StaffordOsProof[] = [
  {
    id: "proof-start-my-day-route-available",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-start-my-day-static-home-action",
    actionId: "start-my-day-home-action",
    title: "The current Home page opened during validation",
    summary: "Local route checks showed that the current operator Home route returned HTTP 200.",
    proofType: "route_check",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_certification",
    expectedResult: "The current Home page opens and remains the working place for today's operating context.",
    observedOutcome: "/operator returned HTTP 200 during S008 route validation.",
    verificationStatus: "verified",
    verifiedBy: "S008 local route checks",
    verifiedAt: "2026-08-01",
    evidenceReferences: ["evidence-start-my-day-current-source"],
    sourceArtifacts: [
      "staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.json",
      "staffordos/architecture/S008_11_EVIDENCE_FOUNDATION.json",
    ],
    confidenceClassification: "high",
    privacyClassification: "Owner-private Stafford Media proof.",
    visibility: "Visible inside Stafford Media /os proof surfaces.",
    notes: "This proves route availability only. It does not prove that business work was completed.",
    learningStatus: "lesson_recorded",
  },
  {
    id: "proof-people-to-contact-route-available",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-convert-opportunities",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-people-to-contact-action",
    title: "The people-to-contact page opened during validation",
    summary: "Local route checks showed that the current people-to-contact route returned HTTP 200.",
    proofType: "route_check",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_certification",
    expectedResult: "The current people-to-contact page opens without copying or mutating lead data.",
    observedOutcome: "/operator/leads returned HTTP 200 during S008 route validation.",
    verificationStatus: "verified",
    verifiedBy: "S008 local route checks",
    verifiedAt: "2026-08-01",
    evidenceReferences: ["evidence-people-to-contact-route"],
    sourceArtifacts: [
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.json",
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
    ],
    confidenceClassification: "high",
    privacyClassification: "Owner-private Stafford Media proof.",
    visibility: "Visible inside Stafford Media /os proof surfaces.",
    notes: "This proves page availability only. It does not prove outreach happened or that a lead advanced.",
    learningStatus: "lesson_recorded",
  },
  {
    id: "proof-money-to-collect-route-available",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-convert-opportunities",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-money-to-collect-action",
    title: "The money-to-collect page opened during validation",
    summary: "Local route checks showed that the current revenue follow-up route returned HTTP 200.",
    proofType: "route_check",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_certification",
    expectedResult: "The current money-to-collect page opens and preserves existing revenue authority boundaries.",
    observedOutcome: "/operator/revenue-command returned HTTP 200 during S008 route validation.",
    verificationStatus: "verified",
    verifiedBy: "S008 local route checks",
    verifiedAt: "2026-08-01",
    evidenceReferences: ["evidence-money-to-collect-route"],
    sourceArtifacts: [
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.json",
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
    ],
    confidenceClassification: "high",
    privacyClassification: "Owner-private Stafford Media proof.",
    visibility: "Visible inside Stafford Media /os proof surfaces.",
    notes: "This proves page availability only. It does not prove that payment was collected or revenue changed.",
    learningStatus: "lesson_recorded",
  },
  {
    id: "proof-active-work-route-available",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-complete-work-with-proof",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-active-work-action",
    title: "The active-work page opened during validation",
    summary: "Local route checks showed that the current customer-work route returned HTTP 200.",
    proofType: "route_check",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_certification",
    expectedResult: "The current customer-work page opens and no work state changes from this Action record.",
    observedOutcome: "/operator/command-center returned HTTP 200 during S008 route validation.",
    verificationStatus: "verified",
    verifiedBy: "S008 local route checks",
    verifiedAt: "2026-08-01",
    evidenceReferences: ["evidence-active-work-route"],
    sourceArtifacts: [
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.json",
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
    ],
    confidenceClassification: "high",
    privacyClassification: "Owner-private Stafford Media proof.",
    visibility: "Visible inside Stafford Media /os proof surfaces.",
    notes: "This proves page availability only. It does not prove delivery completion or customer proof.",
    learningStatus: "lesson_recorded",
  },
  {
    id: "proof-current-goals-static-tests-passed",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-current-objectives-action",
    title: "The current goals foundation passed validation",
    summary: "Objective Registry tests passed and the current goals route returned HTTP 200.",
    proofType: "test_result",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_certification",
    expectedResult: "The objective page opens and shows only static repository-backed objectives for Stafford Media.",
    observedOutcome: "S008 Objective Registry tests passed and /os/objectives returned HTTP 200 during validation.",
    verificationStatus: "verified",
    verifiedBy: "S008 local tests and route checks",
    verifiedAt: "2026-08-01",
    evidenceReferences: ["evidence-current-goals-static"],
    sourceArtifacts: [
      "staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.json",
      "staffordos/architecture/S008_11_EVIDENCE_FOUNDATION.json",
    ],
    confidenceClassification: "high",
    privacyClassification: "Owner-private Stafford Media proof.",
    visibility: "Visible inside Stafford Media /os proof surfaces.",
    notes: "This proves the static objective foundation passed local validation. It does not prove any business objective is complete.",
    learningStatus: "lesson_recorded",
  },
  {
    id: "proof-recent-decisions-static-tests-passed",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-recent-decisions-action",
    title: "The decision memory foundation passed validation",
    summary: "Decision Registry tests passed and the decision memory route returned HTTP 200.",
    proofType: "test_result",
    sourceClassification: "repository_backed",
    authorityClassification: "historical_certification",
    expectedResult: "The decision page opens and shows only repository-backed Stafford Media architecture decisions.",
    observedOutcome: "S008 Decision Registry tests passed and /os/decisions returned HTTP 200 during validation.",
    verificationStatus: "verified",
    verifiedBy: "S008 local tests and route checks",
    verifiedAt: "2026-08-01",
    evidenceReferences: ["evidence-recent-decisions-static"],
    sourceArtifacts: [
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.json",
      "staffordos/architecture/S008_11_EVIDENCE_FOUNDATION.json",
    ],
    confidenceClassification: "high",
    privacyClassification: "Owner-private Stafford Media proof.",
    visibility: "Visible inside Stafford Media /os proof surfaces.",
    notes: "This proves the static decision memory foundation passed local validation. It does not approve future decisions.",
    learningStatus: "lesson_recorded",
  },
];

export function getProofForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return STAFFORDOS_PROOF.filter((proof) => proof.workspaceId === workspaceId);
}

export function getVerifiedProofForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return getProofForWorkspace(workspaceId).filter((proof) => proof.verificationStatus === "verified");
}

export function getProofForAction(actionId: string) {
  return STAFFORDOS_PROOF.filter((proof) => proof.actionId === actionId);
}

export function getProofForDecision(decisionId: string) {
  return STAFFORDOS_PROOF.filter((proof) => proof.decisionId === decisionId);
}

export function getProofForObjective(objectiveId: string) {
  return STAFFORDOS_PROOF.filter((proof) => proof.objectiveId === objectiveId);
}

export function getProofById(proofId: string | null | undefined) {
  return STAFFORDOS_PROOF.find((proof) => proof.id === proofId) || null;
}

export function getProofNeedingReview(workspaceId: StaffordOsWorkspaceId) {
  return getProofForWorkspace(workspaceId).filter((proof) => proof.verificationStatus === "needs_review");
}
