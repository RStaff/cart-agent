import type { StaffordOsWorkspaceId } from "./workspaceRegistry";

export type StaffordOsEvidenceType =
  | "architecture_record"
  | "capability_mapping"
  | "route_validation"
  | "language_standard"
  | "objective_alignment"
  | "decision_memory";

export type StaffordOsEvidenceConfidence = "high" | "medium" | "low" | "needs_review";

export type StaffordOsEvidenceSource = "repository_backed" | "operator_recorded" | "imported" | "planned_example" | "needs_verification";

export type StaffordOsEvidence = {
  id: string;
  workspaceId: StaffordOsWorkspaceId;
  objectiveId: string;
  decisionId: string;
  actionId: string;
  title: string;
  summary: string;
  evidenceType: StaffordOsEvidenceType;
  source: StaffordOsEvidenceSource;
  confidence: StaffordOsEvidenceConfidence;
  collectedAt: string;
  owner: string;
  visibility: string;
  authority: string;
  supports: string;
  notes: string;
  sourceArtifacts: string[];
};

export const EVIDENCE_TYPE_LABELS: Record<StaffordOsEvidenceType, string> = {
  architecture_record: "Architecture record",
  capability_mapping: "Capability mapping",
  route_validation: "Route check",
  language_standard: "Language standard",
  objective_alignment: "Goal alignment",
  decision_memory: "Decision memory",
};

export const EVIDENCE_SOURCE_LABELS: Record<StaffordOsEvidenceSource, string> = {
  repository_backed: "Repository-backed",
  operator_recorded: "Operator-recorded",
  imported: "Imported",
  planned_example: "Planned example",
  needs_verification: "Needs verification",
};

export const EVIDENCE_CONFIDENCE_LABELS: Record<StaffordOsEvidenceConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  needs_review: "Needs review",
};

export const STAFFORDOS_EVIDENCE: StaffordOsEvidence[] = [
  {
    id: "evidence-start-my-day-current-source",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-start-my-day-static-home-action",
    actionId: "start-my-day-home-action",
    title: "The current Home page is the working starting point",
    summary: "S008 selected the existing operator Home page as the safe place to start Stafford Media work today.",
    evidenceType: "architecture_record",
    source: "repository_backed",
    confidence: "high",
    collectedAt: "2026-08-01",
    owner: "Ross / Stafford Media",
    visibility: "Owner-private Stafford Media evidence.",
    authority: "Static architecture evidence only; not execution authority.",
    supports: "Start My Day",
    notes: "This supports opening the current Home page before deeper work and keeps /os from pretending it has live ranking.",
    sourceArtifacts: [
      "staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md",
      "staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts",
    ],
  },
  {
    id: "evidence-people-to-contact-route",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-convert-opportunities",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-people-to-contact-action",
    title: "People to contact has an existing working page",
    summary: "The capability map identifies the current people-to-contact page as available for Stafford Media.",
    evidenceType: "capability_mapping",
    source: "repository_backed",
    confidence: "high",
    collectedAt: "2026-08-01",
    owner: "Ross / Stafford Media",
    visibility: "Owner-private Stafford Media evidence.",
    authority: "Static route evidence only; not outreach authority.",
    supports: "Review People to Contact",
    notes: "This supports navigating to the current lead page without copying lead data or creating contact actions.",
    sourceArtifacts: [
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
      "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts",
    ],
  },
  {
    id: "evidence-money-to-collect-route",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-convert-opportunities",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-money-to-collect-action",
    title: "Money to collect has an existing working page",
    summary: "The capability map identifies the current money-to-collect page as available for reviewing revenue follow-up.",
    evidenceType: "capability_mapping",
    source: "repository_backed",
    confidence: "high",
    collectedAt: "2026-08-01",
    owner: "Ross / Stafford Media",
    visibility: "Owner-private Stafford Media evidence.",
    authority: "Static route evidence only; not payment or revenue authority.",
    supports: "Review Money to Collect",
    notes: "This supports opening the current revenue page while keeping captured revenue separate from estimates.",
    sourceArtifacts: [
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
      "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts",
    ],
  },
  {
    id: "evidence-active-work-route",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-complete-work-with-proof",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-active-work-action",
    title: "Active work has an existing customer-work surface",
    summary: "The capability map identifies the current customer-work page as the place to review delivery, proof, and blockers.",
    evidenceType: "capability_mapping",
    source: "repository_backed",
    confidence: "medium",
    collectedAt: "2026-08-01",
    owner: "Ross / Stafford Media",
    visibility: "Owner-private Stafford Media evidence.",
    authority: "Static route evidence only; not delivery authority.",
    supports: "Review Active Work",
    notes: "This supports reviewing customer work without changing delivery state or claiming proof after the fact.",
    sourceArtifacts: [
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
      "staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
    ],
  },
  {
    id: "evidence-current-goals-static",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-current-objectives-action",
    title: "Current goals are static and repository-backed",
    summary: "S008.08 created three Stafford Media goals so current actions can show what they support.",
    evidenceType: "objective_alignment",
    source: "repository_backed",
    confidence: "high",
    collectedAt: "2026-08-01",
    owner: "Ross / Stafford Media",
    visibility: "Owner-private Stafford Media evidence.",
    authority: "Static goal evidence only; not live measurement authority.",
    supports: "Review Current Goals",
    notes: "This supports checking goal alignment before treating an action as important.",
    sourceArtifacts: [
      "staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.ts",
      "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts",
    ],
  },
  {
    id: "evidence-recent-decisions-static",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    actionId: "review-recent-decisions-action",
    title: "Recent decisions explain the current operating shape",
    summary: "S008.09 records why /operator remains the working source and why /os stays read-only while it grows.",
    evidenceType: "decision_memory",
    source: "repository_backed",
    confidence: "high",
    collectedAt: "2026-08-01",
    owner: "Ross / Stafford Media",
    visibility: "Owner-private Stafford Media evidence.",
    authority: "Static decision evidence only; not approval or execution authority.",
    supports: "Review Recent Decisions",
    notes: "This supports reviewing established decisions before changing direction or adding new operating surfaces.",
    sourceArtifacts: [
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts",
      "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts",
    ],
  },
];

export function getEvidenceForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return STAFFORDOS_EVIDENCE.filter((evidence) => evidence.workspaceId === workspaceId);
}

export function getEvidenceForAction(actionId: string) {
  return STAFFORDOS_EVIDENCE.filter((evidence) => evidence.actionId === actionId);
}

export function getEvidenceForDecision(decisionId: string) {
  return STAFFORDOS_EVIDENCE.filter((evidence) => evidence.decisionId === decisionId);
}

export function getEvidenceById(evidenceId: string | null | undefined) {
  return STAFFORDOS_EVIDENCE.find((evidence) => evidence.id === evidenceId) || null;
}
