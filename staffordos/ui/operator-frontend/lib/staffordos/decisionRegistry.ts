import type { StaffordOsWorkspaceId } from "./workspaceRegistry";
import type { SourceConflictStatus, SourceFreshness, SourceStaticity } from "./sourceSnapshot";

export type StaffordOsDecisionStatus =
  | "proposed"
  | "awaiting_approval"
  | "chosen"
  | "deferred"
  | "rejected"
  | "completed"
  | "needs_review";

export type StaffordOsDecisionSource =
  | "repository_backed"
  | "operator_recorded"
  | "imported"
  | "ai_prepared"
  | "planned_example"
  | "needs_verification";

export type StaffordOsDecisionAuthority =
  | "owner_decision"
  | "approved_delegate_decision"
  | "policy_governed_decision"
  | "recommendation_only"
  | "historical_evidence"
  | "needs_authority_review";

export type StaffordOsDecisionConfidence = "high" | "medium" | "low" | "needs_review";

export type StaffordOsOutcomeStatus = "expected" | "not_observed" | "observed" | "superseded" | "needs_review";

export type StaffordOsDecision = {
  id: string;
  workspaceId: StaffordOsWorkspaceId;
  missionId: string;
  objectiveId: string | null;
  actionId: string | null;
  title: string;
  summary: string;
  situation: string;
  decision: string;
  why: string;
  evidenceReferences: string[];
  alternativesConsidered: string[];
  tradeoffs: string[];
  risks: string[];
  uncertainty: string;
  confidenceClassification: StaffordOsDecisionConfidence;
  decisionOwner: string;
  authorityClassification: StaffordOsDecisionAuthority;
  approvalStatus: StaffordOsDecisionStatus;
  timestamp: string;
  recordedAt: string;
  asOf: string;
  staticity: SourceStaticity;
  freshness: SourceFreshness;
  conflictStatus: SourceConflictStatus;
  supersededBy: string[];
  limitations: string[];
  expectedResult: string;
  proofRequirement: string;
  outcomeStatus: StaffordOsOutcomeStatus;
  learningDestination: string;
  privacyClassification: string;
  sourceClassification: StaffordOsDecisionSource;
  authorityStatus: string;
};

export const DECISION_STATUS_LABELS: Record<StaffordOsDecisionStatus, string> = {
  proposed: "Proposed",
  awaiting_approval: "Awaiting approval",
  chosen: "Chosen",
  deferred: "Deferred",
  rejected: "Rejected",
  completed: "Completed",
  needs_review: "Needs review",
};

export const DECISION_SOURCE_LABELS: Record<StaffordOsDecisionSource, string> = {
  repository_backed: "Repository-backed",
  operator_recorded: "Operator-recorded",
  imported: "Imported",
  ai_prepared: "AI-prepared",
  planned_example: "Planned example",
  needs_verification: "Needs verification",
};

export const DECISION_AUTHORITY_LABELS: Record<StaffordOsDecisionAuthority, string> = {
  owner_decision: "Owner decision",
  approved_delegate_decision: "Approved delegate decision",
  policy_governed_decision: "Policy-governed decision",
  recommendation_only: "Recommendation only",
  historical_evidence: "Historical evidence",
  needs_authority_review: "Needs authority review",
};

export const DECISION_CONFIDENCE_LABELS: Record<StaffordOsDecisionConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  needs_review: "Needs review",
};

export const DECISION_OUTCOME_LABELS: Record<StaffordOsOutcomeStatus, string> = {
  expected: "Expected",
  not_observed: "Not observed yet",
  observed: "Observed",
  superseded: "Superseded",
  needs_review: "Needs review",
};

export const STAFFORDOS_DECISIONS: StaffordOsDecision[] = [
  {
    id: "s008-operator-runtime-canonical",
    workspaceId: "stafford-media",
    missionId: "s008-foundation",
    objectiveId: "stafford-media-operating-loop",
    actionId: null,
    title: "Keep the current operator pages as the working source",
    summary: "The existing operator pages remain the working place while /os grows as a read-only shell.",
    situation: "The existing /operator surfaces contain the real StaffordOS operating pages. S008 added /os as a separate foundation.",
    decision: "/operator remains runtime-canonical while /os evolves incrementally through read-only links and parity checks.",
    why: "This protects existing work and prevents StaffordOS from splitting into competing interfaces.",
    evidenceReferences: [
      "staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md",
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
      "staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md",
    ],
    alternativesConsidered: [
      "Move existing operator pages under /os immediately.",
      "Keep /operator and /os as separate long-term products.",
    ],
    tradeoffs: [
      "Migration is slower, but existing operating truth stays intact.",
      "/os must be transparent about what is available now versus planned.",
    ],
    risks: [
      "If links and language drift, operators could misunderstand which surface is authoritative.",
    ],
    uncertainty: "Low. Multiple S008 artifacts repeat this route strategy.",
    confidenceClassification: "high",
    decisionOwner: "Ross / StaffordOS architecture checkpoint",
    authorityClassification: "owner_decision",
    approvalStatus: "chosen",
    timestamp: "2026-07-30T23:16:21-04:00",
    recordedAt: "2026-07-30T23:16:21-04:00",
    asOf: "2026-07-30T23:16:21-04:00",
    staticity: "HISTORICAL",
    freshness: "HISTORICAL",
    conflictStatus: "NO_CONFLICT",
    supersededBy: [],
    limitations: [
      "Historical repository-backed decision memory; it records the decision as it stood when recorded and may be superseded by later architecture.",
    ],
    expectedResult: "StaffordOS can grow without breaking or duplicating the existing operator workflow.",
    proofRequirement: "/operator routes remain unchanged and /os routes stay read-only presentation surfaces.",
    outcomeStatus: "expected",
    learningDestination: "StaffordOS route strategy and migration memory",
    privacyClassification: "Owner-private architecture record.",
    sourceClassification: "repository_backed",
    authorityStatus: "Static architectural decision memory; not execution authority.",
  },
  {
    id: "s008-operator-first-language",
    workspaceId: "stafford-media",
    missionId: "s008-foundation",
    objectiveId: "stafford-media-operating-loop",
    actionId: null,
    title: "Use language Ross can act on",
    summary: "StaffordOS should speak like a clear chief of staff, not an infrastructure console.",
    situation: "Early StaffordOS surfaces mixed operator language with command, registry, and system terms.",
    decision: "Operator-facing pages use plain, action-oriented language and keep technical terms secondary.",
    why: "The operating system should help Ross understand what is happening, why it matters, and what to do next.",
    evidenceReferences: [
      "staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.md",
      "staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md",
      "staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md",
    ],
    alternativesConsidered: [
      "Preserve internal route and registry names as primary UI labels.",
      "Rename code and routes immediately to match operator copy.",
    ],
    tradeoffs: [
      "Operator copy improves clarity without forcing risky route or code renames.",
      "Developers must preserve a boundary between internal names and visible labels.",
    ],
    risks: [
      "If the language standard is ignored, /os can become another technical console.",
    ],
    uncertainty: "Low. S008.02 is the canonical language authority.",
    confidenceClassification: "high",
    decisionOwner: "Ross / StaffordOS architecture checkpoint",
    authorityClassification: "owner_decision",
    approvalStatus: "chosen",
    timestamp: "2026-07-30T23:16:21-04:00",
    recordedAt: "2026-07-30T23:16:21-04:00",
    asOf: "2026-07-30T23:16:21-04:00",
    staticity: "HISTORICAL",
    freshness: "HISTORICAL",
    conflictStatus: "NO_CONFLICT",
    supersededBy: [],
    limitations: [
      "Historical repository-backed decision memory; it records the decision as it stood when recorded and may be superseded by later architecture.",
    ],
    expectedResult: "Future surfaces explain choices, evidence, risk, and proof in operator-readable language.",
    proofRequirement: "Visible S008 UI copy avoids internal implementation terms as primary labels.",
    outcomeStatus: "expected",
    learningDestination: "StaffordOS language standard and future UI review checklist",
    privacyClassification: "Owner-private architecture record.",
    sourceClassification: "repository_backed",
    authorityStatus: "Static architectural decision memory; not execution authority.",
  },
  {
    id: "s008-workspace-families",
    workspaceId: "stafford-media",
    missionId: "s008-multi-workspace",
    objectiveId: "stafford-media-operating-loop",
    actionId: null,
    title: "Use Business, Professional, and Personal workspace families",
    summary: "StaffordOS will grow through workspace families instead of one shared data space.",
    situation: "StaffordOS must support Stafford Media, products, career work, and personal/family capabilities without a future rebuild.",
    decision: "Use Business, Professional, and Personal as the approved top-level workspace families.",
    why: "Workspace families preserve privacy, language, membership, permissions, memory, and evidence boundaries.",
    evidenceReferences: [
      "staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md",
      "staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md",
    ],
    alternativesConsidered: [
      "Treat every product or life area as a separate application.",
      "Use one global workspace and rely on page-level filtering later.",
    ],
    tradeoffs: [
      "Shared platform primitives stay reusable, but every future feature must respect workspace context.",
      "The model adds discipline before real multi-user authorization exists.",
    ],
    risks: [
      "If future features skip workspace context, private or business information could appear in the wrong place.",
    ],
    uncertainty: "Medium. The model is architecturally chosen, but real membership and permissions are not implemented yet.",
    confidenceClassification: "medium",
    decisionOwner: "Ross / StaffordOS architecture checkpoint",
    authorityClassification: "owner_decision",
    approvalStatus: "chosen",
    timestamp: "2026-08-01T19:24:17-04:00",
    recordedAt: "2026-08-01T19:24:17-04:00",
    asOf: "2026-08-01T19:24:17-04:00",
    staticity: "HISTORICAL",
    freshness: "HISTORICAL",
    conflictStatus: "NO_CONFLICT",
    supersededBy: [],
    limitations: [
      "Historical repository-backed decision memory; it records the decision as it stood when recorded and may be superseded by later architecture.",
    ],
    expectedResult: "StaffordOS can add Abando, Professional, Personal, Family, and Media later without collapsing privacy boundaries.",
    proofRequirement: "Current /os workspace selector presents only approved initial workspace families.",
    outcomeStatus: "expected",
    learningDestination: "StaffordOS workspace architecture memory",
    privacyClassification: "Owner-private architecture record.",
    sourceClassification: "repository_backed",
    authorityStatus: "Static architectural decision memory; not authorization authority.",
  },
  {
    id: "s008-stafford-media-now-planned-boundary",
    workspaceId: "stafford-media",
    missionId: "s008-workspace-context",
    objectiveId: "stafford-media-operating-loop",
    actionId: null,
    title: "Make Stafford Media available now and keep the other workspaces planned",
    summary: "Stafford Media is the usable workspace today. Professional and Personal remain planned presentation states.",
    situation: "S008 introduced workspace selection before real membership, authorization, Professional, or Personal workflows exist.",
    decision: "Default to Stafford Media, mark it Available now, and keep Professional and Personal planned with no Stafford Media links except return paths.",
    why: "The shell can become future-safe without pretending planned workspaces contain active work.",
    evidenceReferences: [
      "staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
    ],
    alternativesConsidered: [
      "Hide Professional and Personal until implemented.",
      "Show placeholder dashboards that look like active work.",
    ],
    tradeoffs: [
      "Future workspace shape is visible, but planned states must be plainly labeled.",
      "The selector remains presentation-only until real authorization exists.",
    ],
    risks: [
      "Planned workspaces could mislead the operator if they expose business links or fake data.",
    ],
    uncertainty: "Low for the current presentation boundary; high for future real access control until implemented.",
    confidenceClassification: "high",
    decisionOwner: "Ross / StaffordOS architecture checkpoint",
    authorityClassification: "owner_decision",
    approvalStatus: "chosen",
    timestamp: "2026-08-01T20:04:29-04:00",
    recordedAt: "2026-08-01T20:04:29-04:00",
    asOf: "2026-08-01T20:04:29-04:00",
    staticity: "HISTORICAL",
    freshness: "HISTORICAL",
    conflictStatus: "NO_CONFLICT",
    supersededBy: ["G002_00_PROFESSIONAL_MODE_AND_WORKSPACE_REGISTRY_RECONCILIATION"],
    limitations: [
      "Historical repository-backed decision memory.",
      "G002 supersedes the Professional planned-only portion; Professional now has Career Home and Job Search foundations while My Job and Personal remain planned.",
    ],
    expectedResult: "Ross can see which part of StaffordOS is usable today without confusing planned workspaces for live systems.",
    proofRequirement: "Professional and Personal render planned-state content only and expose no Stafford Media operating links.",
    outcomeStatus: "expected",
    learningDestination: "StaffordOS workspace context memory",
    privacyClassification: "Owner-private architecture record.",
    sourceClassification: "repository_backed",
    authorityStatus: "Static architectural decision memory; not authorization authority.",
  },
  {
    id: "s008-start-my-day-static-home-action",
    workspaceId: "stafford-media",
    missionId: "s008-unified-home",
    objectiveId: "stafford-media-operating-loop",
    actionId: "start-my-day-home-action",
    title: "Start Stafford Media Home with Start My Day",
    summary: "The /os Home points first to the current Home page instead of claiming live prioritization.",
    situation: "/os Home needed to answer what deserves attention without a live Action registry, Decision registry, Objective registry, or AI priority engine.",
    decision: "Use Start My Day as the current static Stafford Media Home action and link it to the existing /operator Home page.",
    why: "This gives Ross a useful starting point while preserving the truth that live ranking is not connected yet.",
    evidenceReferences: [
      "staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md",
      "staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/homePresentation.ts",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
    ],
    alternativesConsidered: [
      "Show no primary action until a live Action registry exists.",
      "Choose a more specific business page as if it were dynamically prioritized.",
    ],
    tradeoffs: [
      "The Home is immediately useful, but it must disclose that live ranking is not connected.",
      "The action supports the operating-loop objective but does not measure it.",
    ],
    risks: [
      "If transparency copy is removed, the static action could look like a live AI recommendation.",
    ],
    uncertainty: "Low for the static route choice; live priority logic remains future work.",
    confidenceClassification: "high",
    decisionOwner: "Ross / StaffordOS architecture checkpoint",
    authorityClassification: "owner_decision",
    approvalStatus: "chosen",
    timestamp: "2026-08-01T20:19:24-04:00",
    recordedAt: "2026-08-01T20:19:24-04:00",
    asOf: "2026-08-01T20:19:24-04:00",
    staticity: "HISTORICAL",
    freshness: "HISTORICAL",
    conflictStatus: "NO_CONFLICT",
    supersededBy: [],
    limitations: [
      "Historical repository-backed decision memory; it records the decision as it stood when recorded and may be superseded by later architecture.",
    ],
    expectedResult: "The operator has one clear place to continue without duplicating existing /operator behavior.",
    proofRequirement: "/os Home renders Start My Day as a static available action and links to /operator.",
    outcomeStatus: "expected",
    learningDestination: "StaffordOS Home presentation memory",
    privacyClassification: "Owner-private architecture record.",
    sourceClassification: "repository_backed",
    authorityStatus: "Static architectural decision memory; not action or execution authority.",
  },
];

export function getDecisionsForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return STAFFORDOS_DECISIONS.filter((decision) => decision.workspaceId === workspaceId);
}

export function getChosenDecisionsForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return getDecisionsForWorkspace(workspaceId).filter((decision) => decision.approvalStatus === "chosen");
}

export function getDecisionById(decisionId: string | null | undefined) {
  return STAFFORDOS_DECISIONS.find((decision) => decision.id === decisionId) || null;
}

export function getDecisionsForObjective(objectiveId: string) {
  return STAFFORDOS_DECISIONS.filter((decision) => decision.objectiveId === objectiveId);
}

export function getDecisionsForMission(missionId: string) {
  return STAFFORDOS_DECISIONS.filter((decision) => decision.missionId === missionId);
}

export function getDecisionsForAction(actionId: string) {
  return STAFFORDOS_DECISIONS.filter((decision) => decision.actionId === actionId);
}
