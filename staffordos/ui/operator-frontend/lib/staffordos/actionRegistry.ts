import type { StaffordOsWorkspaceId } from "./workspaceRegistry";

export type StaffordOsActionStatus = "available_now" | "planned" | "paused" | "completed" | "needs_review";

export type StaffordOsActionSource =
  | "repository_backed"
  | "operator_recorded"
  | "imported"
  | "ai_prepared"
  | "planned_example"
  | "needs_verification";

export type StaffordOsActionPriority = "primary" | "supporting" | "review" | "planned";

export type StaffordOsActionEffort = "short_review" | "focused_review" | "planned";

export type StaffordOsAction = {
  id: string;
  workspaceId: StaffordOsWorkspaceId;
  objectiveId: string;
  decisionId: string;
  capabilityId: string | null;
  title: string;
  summary: string;
  reason: string;
  expectedResult: string;
  proofNeeded: string;
  owner: string;
  authority: string;
  priorityClassification: StaffordOsActionPriority;
  effortClassification: StaffordOsActionEffort;
  visibility: string;
  status: StaffordOsActionStatus;
  source: StaffordOsActionSource;
  createdFrom: string[];
  learningTarget: string;
  continueHref: string | null;
  continueLabel: string;
};

export const ACTION_STATUS_LABELS: Record<StaffordOsActionStatus, string> = {
  available_now: "Available now",
  planned: "Planned",
  paused: "Paused",
  completed: "Completed",
  needs_review: "Needs review",
};

export const ACTION_SOURCE_LABELS: Record<StaffordOsActionSource, string> = {
  repository_backed: "Repository-backed",
  operator_recorded: "Operator-recorded",
  imported: "Imported",
  ai_prepared: "AI-prepared",
  planned_example: "Planned example",
  needs_verification: "Needs verification",
};

export const ACTION_PRIORITY_LABELS: Record<StaffordOsActionPriority, string> = {
  primary: "Primary",
  supporting: "Supporting",
  review: "Review",
  planned: "Planned",
};

export const ACTION_EFFORT_LABELS: Record<StaffordOsActionEffort, string> = {
  short_review: "Short review",
  focused_review: "Focused review",
  planned: "Planned",
};

export const STAFFORDOS_ACTIONS: StaffordOsAction[] = [
  {
    id: "start-my-day-home-action",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-start-my-day-static-home-action",
    capabilityId: "start-my-day",
    title: "Start My Day",
    summary: "Open the current Stafford Media Home page before choosing deeper work.",
    reason: "This is the current operating surface for the workday, main priority, current risks, and business health.",
    expectedResult: "Ross continues from the existing Home page instead of a duplicate view.",
    proofNeeded: "The current Home page opens and remains the working place for today's operating context.",
    owner: "Ross / Stafford Media",
    authority: "Read-only navigation to the current operator Home page.",
    priorityClassification: "primary",
    effortClassification: "short_review",
    visibility: "Owner-private Stafford Media action.",
    status: "available_now",
    source: "repository_backed",
    createdFrom: [
      "staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md",
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
    ],
    learningTarget: "StaffordOS Home presentation memory",
    continueHref: "/operator",
    continueLabel: "Continue",
  },
  {
    id: "review-people-to-contact-action",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-convert-opportunities",
    decisionId: "s008-operator-runtime-canonical",
    capabilityId: "find-people-to-contact",
    title: "Review People to Contact",
    summary: "Open the current people-to-contact page when outreach or follow-up should move next.",
    reason: "Qualified opportunities need a clear next contact path before they can become paid work.",
    expectedResult: "Ross sees the current lead and contact-readiness surface.",
    proofNeeded: "The current people-to-contact page opens without copying or mutating lead data.",
    owner: "Ross / Stafford Media",
    authority: "Read-only navigation to the existing operator route.",
    priorityClassification: "supporting",
    effortClassification: "short_review",
    visibility: "Owner-private Stafford Media action.",
    status: "available_now",
    source: "repository_backed",
    createdFrom: [
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
    ],
    learningTarget: "Stafford Media pipeline action memory",
    continueHref: "/operator/leads",
    continueLabel: "Open current page",
  },
  {
    id: "review-money-to-collect-action",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-convert-opportunities",
    decisionId: "s008-operator-runtime-canonical",
    capabilityId: "see-money-to-collect",
    title: "Review Money to Collect",
    summary: "Open the current money-to-collect page when payment or offer follow-up needs review.",
    reason: "Revenue-related actions need to stay tied to existing payment and revenue truth.",
    expectedResult: "Ross sees the current revenue follow-up surface without treating estimates as captured revenue.",
    proofNeeded: "The current money-to-collect page opens and preserves existing revenue authority boundaries.",
    owner: "Ross / Stafford Media",
    authority: "Read-only navigation to the existing operator route.",
    priorityClassification: "supporting",
    effortClassification: "short_review",
    visibility: "Owner-private Stafford Media action.",
    status: "available_now",
    source: "repository_backed",
    createdFrom: [
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
      "staffordos/authority/canonical_money_model_v1.md",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
    ],
    learningTarget: "Stafford Media revenue action memory",
    continueHref: "/operator/revenue-command",
    continueLabel: "Open current page",
  },
  {
    id: "review-active-work-action",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-complete-work-with-proof",
    decisionId: "s008-operator-runtime-canonical",
    capabilityId: "manage-current-customer-work",
    title: "Review Active Work",
    summary: "Open the current customer-work surface when delivery, proof, or blockers need attention.",
    reason: "Customer work should stay scoped, governed, and proof-backed before completion is claimed.",
    expectedResult: "Ross sees the current active-work surface without changing delivery state.",
    proofNeeded: "The current customer-work page opens and no work state changes from this Action record.",
    owner: "Ross / Stafford Media",
    authority: "Read-only navigation to the existing operator route.",
    priorityClassification: "supporting",
    effortClassification: "focused_review",
    visibility: "Owner-private Stafford Media action.",
    status: "available_now",
    source: "repository_backed",
    createdFrom: [
      "staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md",
      "staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts",
    ],
    learningTarget: "Stafford Media delivery action memory",
    continueHref: "/operator/command-center",
    continueLabel: "Open current page",
  },
  {
    id: "review-current-objectives-action",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    capabilityId: null,
    title: "Review Current Goals",
    summary: "Open the current objective page when the next action needs goal context.",
    reason: "StaffordOS should not rank or present work without showing what that work supports.",
    expectedResult: "Ross sees the current Stafford Media goals and how current actions relate to them.",
    proofNeeded: "The objective page opens and shows only static repository-backed objectives for Stafford Media.",
    owner: "Ross / Stafford Media",
    authority: "Read-only navigation inside the /os presentation shell.",
    priorityClassification: "review",
    effortClassification: "short_review",
    visibility: "Owner-private Stafford Media action.",
    status: "available_now",
    source: "repository_backed",
    createdFrom: [
      "staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.ts",
    ],
    learningTarget: "StaffordOS objective alignment memory",
    continueHref: "/os/objectives",
    continueLabel: "Open goals",
  },
  {
    id: "review-recent-decisions-action",
    workspaceId: "stafford-media",
    objectiveId: "stafford-media-operating-loop",
    decisionId: "s008-operator-runtime-canonical",
    capabilityId: null,
    title: "Review Recent Decisions",
    summary: "Open the current decision memory page before changing direction.",
    reason: "Actions should stay connected to what StaffordOS already chose and why.",
    expectedResult: "Ross sees the architecture decisions behind the current operating shell.",
    proofNeeded: "The decision page opens and shows only repository-backed Stafford Media architecture decisions.",
    owner: "Ross / Stafford Media",
    authority: "Read-only navigation inside the /os presentation shell.",
    priorityClassification: "review",
    effortClassification: "short_review",
    visibility: "Owner-private Stafford Media action.",
    status: "available_now",
    source: "repository_backed",
    createdFrom: [
      "staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.md",
      "staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts",
    ],
    learningTarget: "StaffordOS decision memory",
    continueHref: "/os/decisions",
    continueLabel: "Open decisions",
  },
];

export function getActionsForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return STAFFORDOS_ACTIONS.filter((action) => action.workspaceId === workspaceId);
}

export function getActionById(actionId: string | null | undefined) {
  return STAFFORDOS_ACTIONS.find((action) => action.id === actionId) || null;
}

export function getActionsForDecision(decisionId: string) {
  return STAFFORDOS_ACTIONS.filter((action) => action.decisionId === decisionId);
}

export function getActionsForObjective(objectiveId: string) {
  return STAFFORDOS_ACTIONS.filter((action) => action.objectiveId === objectiveId);
}

export function getPrimaryAction(workspaceId: StaffordOsWorkspaceId) {
  return getActionsForWorkspace(workspaceId).find(
    (action) => action.priorityClassification === "primary" && action.status === "available_now",
  ) || null;
}
