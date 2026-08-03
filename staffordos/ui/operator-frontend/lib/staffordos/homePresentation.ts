import {
  AVAILABILITY_LABELS,
  capabilitiesForWorkspace,
  type CapabilitySource,
  type StaffordOsCapability,
} from "./capabilities";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  type StaffordOsWorkspaceId,
} from "./workspaceRegistry";
import { getObjectiveById } from "./objectiveRegistry";
import {
  ACTION_EFFORT_LABELS,
  ACTION_STATUS_LABELS,
  getPrimaryAction,
  type StaffordOsAction,
} from "./actionRegistry";

export type HomeActionPresentation = {
  id: string;
  capabilityId: string;
  title: string;
  whatToDo: string;
  whyNow: string;
  expectedResult: string;
  evidence?: string;
  effort?: string;
  risk?: string;
  confidence?: string;
  approvalNeeded?: string;
  completionProof?: string;
  supportedObjectiveId?: string;
  supportedObjectiveTitle?: string;
  objectiveAlignmentNote?: string;
  continueHref: string | null;
  continueLabel: string;
  availabilityLabel: string;
  source: CapabilitySource;
};

export type PlannedHomeCapability = {
  id: string;
  title: string;
  summary: string;
  status?: string;
  href?: string | null;
  actionLabel?: string;
};

export type HomePresentation = {
  workspaceId: StaffordOsWorkspaceId;
  heading: string;
  summary: string;
  primaryAction: HomeActionPresentation | null;
  supportingActions: HomeActionPresentation[];
  plannedCapabilities: PlannedHomeCapability[];
  evidenceNote: string;
  authorityNote: string;
  limitationNote: string;
  returnWorkspaceLabel?: string;
};

function capabilityById(workspaceId: StaffordOsWorkspaceId, capabilityId: string) {
  return capabilitiesForWorkspace(workspaceId).find((capability) => capability.id === capabilityId);
}

function actionFromCapability(
  capability: StaffordOsCapability,
  overrides: Partial<HomeActionPresentation> = {},
): HomeActionPresentation {
  return {
    id: `${capability.id}-home-action`,
    capabilityId: capability.id,
    title: capability.title,
    whatToDo: capability.title,
    whyNow: capability.description,
    expectedResult: capability.destinationLabel,
    evidence: capability.readiness,
    continueHref: capability.currentRoute,
    continueLabel: "Continue",
    availabilityLabel: AVAILABILITY_LABELS[capability.availability],
    source: capability.source,
    ...overrides,
  };
}

function actionFromRegisteredAction(action: StaffordOsAction): HomeActionPresentation {
  const capability = action.capabilityId ? capabilityById(action.workspaceId, action.capabilityId) : null;
  const objective = getObjectiveById(action.objectiveId);

  return {
    id: action.id,
    capabilityId: action.capabilityId || "",
    title: action.title,
    whatToDo: action.title,
    whyNow: action.reason,
    expectedResult: action.expectedResult,
    evidence: action.summary,
    effort: ACTION_EFFORT_LABELS[action.effortClassification],
    risk: "Live priority ranking is not connected here yet.",
    completionProof: action.proofNeeded,
    supportedObjectiveId: objective?.id,
    supportedObjectiveTitle: objective?.title,
    objectiveAlignmentNote:
      "Action guidance is based on the static Action Registry. Live ranking and execution are not connected yet.",
    continueHref: action.continueHref,
    continueLabel: action.continueLabel,
    availabilityLabel: ACTION_STATUS_LABELS[action.status],
    source: capability?.source || "repository_backed",
  };
}

function requiredCapability(workspaceId: StaffordOsWorkspaceId, capabilityId: string) {
  const capability = capabilityById(workspaceId, capabilityId);
  if (!capability) {
    throw new Error(`Missing StaffordOS Home capability: ${workspaceId}:${capabilityId}`);
  }
  return capability;
}

const primaryStaffordMediaAction = getPrimaryAction(DEFAULT_STAFFORDOS_WORKSPACE_ID);

export const STAFFORD_MEDIA_HOME_PRESENTATION: HomePresentation = {
  workspaceId: "stafford-media",
  heading: "What Deserves Attention",
  summary:
    "Start with the current Stafford Media operating page. It is the working place StaffordOS can use today.",
  primaryAction: primaryStaffordMediaAction ? actionFromRegisteredAction(primaryStaffordMediaAction) : null,
  supportingActions: [
    actionFromCapability(requiredCapability("stafford-media", "find-people-to-contact"), {
      whyNow: "Use this when the next useful move is outreach or relationship follow-up.",
      expectedResult: "You open the current people-to-contact page.",
    }),
    actionFromCapability(requiredCapability("stafford-media", "see-money-to-collect"), {
      whyNow: "Use this when payment waits, offers, or revenue follow-up need review.",
      expectedResult: "You open the current money-to-collect page.",
    }),
    actionFromCapability(requiredCapability("stafford-media", "manage-current-customer-work"), {
      whyNow: "Use this when current customer work, proof, or delivery blockers need attention.",
      expectedResult: "You open the current customer-work surface.",
    }),
  ],
  plannedCapabilities: [],
  evidenceNote:
    "This Home uses repository-backed routes from the current capability map. It does not copy live business data.",
  authorityNote:
    "StaffordOS is using the current operating structure. Live priority ranking, objectives, and evidence aggregation are planned.",
  limitationNote:
    "Not connected yet: live ranking, real action records, AI recommendations, live objective measurement, and evidence aggregation.",
};

export const PROFESSIONAL_HOME_PRESENTATION: HomePresentation = {
  workspaceId: "professional",
  heading: "Professional",
  summary:
    "Use one private Professional workspace for finding work now and succeeding at work later.",
  primaryAction: null,
  supportingActions: [],
  plannedCapabilities: [
    {
      id: "career-home",
      title: "Career Home",
      summary: "A read-only overview for Professional modes, transition rules, and what is connected.",
      status: "Available now",
      href: "/os/professional",
      actionLabel: "Open Career Home",
    },
    {
      id: "job-search",
      title: "Job Search",
      summary: "Use Job Command to review the current foundation and what still needs Ross's review.",
      status: "Available now",
      href: "/os/professional/jobs",
      actionLabel: "Open Job Command",
    },
    {
      id: "my-job",
      title: "My Job",
      summary: "A planned mode for succeeding in a role after Ross confirms a work transition.",
      status: "Planned",
    },
    {
      id: "career-evidence",
      title: "Career Evidence",
      summary: "Private source intake exists outside Git, but review is not connected to this screen yet.",
      status: "Not connected yet",
    },
    {
      id: "achievements",
      title: "Achievements",
      summary: "Achievement review is planned and will depend on verified career evidence.",
      status: "Planned",
    },
    {
      id: "learning",
      title: "Learning",
      summary: "Professional learning review is planned and will remain separate from Job Search records.",
      status: "Planned",
    },
  ],
  evidenceNote:
    "Available now: read-only Career Home, Job Command foundation, and local Job Opportunity intake bridge. No private Professional records are connected here.",
  authorityNote: "Professional is owner-private by design. Workspace selection changes presentation only.",
  limitationNote:
    "Not connected yet: canonical career facts, live job ranking, My Job records, employment management, access controls, and external integrations.",
  returnWorkspaceLabel: "Return to Stafford Media",
};

export const PERSONAL_HOME_PRESENTATION: HomePresentation = {
  workspaceId: "personal",
  heading: "Personal Is Planned",
  summary:
    "This workspace is intended for private planning, learning, family, and media work. No personal data is connected yet.",
  primaryAction: null,
  supportingActions: [],
  plannedCapabilities: [
    {
      id: "private-planning",
      title: "Private Planning",
      summary: "A future private place to choose personal priorities and preserve lessons.",
    },
    {
      id: "learning",
      title: "Learning",
      summary: "A future place to organize practice, study, and useful knowledge.",
    },
    {
      id: "family-and-media",
      title: "Family and Media",
      summary: "Future sharing, watching, creation, and memories will require explicit approval.",
    },
  ],
  evidenceNote: "No family members, media assets, memories, shared content, or private tasks are connected.",
  authorityNote: "Personal is owner-private by default. Family and Media access will require explicit sharing.",
  limitationNote: "Stafford Media is the part of StaffordOS you can use today.",
  returnWorkspaceLabel: "Return to Stafford Media",
};

export const HOME_PRESENTATIONS: Record<StaffordOsWorkspaceId, HomePresentation> = {
  "stafford-media": STAFFORD_MEDIA_HOME_PRESENTATION,
  professional: PROFESSIONAL_HOME_PRESENTATION,
  personal: PERSONAL_HOME_PRESENTATION,
};

export function homePresentationForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return HOME_PRESENTATIONS[workspaceId] || HOME_PRESENTATIONS[DEFAULT_STAFFORDOS_WORKSPACE_ID];
}
