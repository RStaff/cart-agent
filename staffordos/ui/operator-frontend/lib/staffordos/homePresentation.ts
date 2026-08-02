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
  continueHref: string | null;
  continueLabel: string;
  availabilityLabel: string;
  source: CapabilitySource;
};

export type PlannedHomeCapability = {
  id: string;
  title: string;
  summary: string;
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

function requiredCapability(workspaceId: StaffordOsWorkspaceId, capabilityId: string) {
  const capability = capabilityById(workspaceId, capabilityId);
  if (!capability) {
    throw new Error(`Missing StaffordOS Home capability: ${workspaceId}:${capabilityId}`);
  }
  return capability;
}

const startMyDay = requiredCapability(DEFAULT_STAFFORDOS_WORKSPACE_ID, "start-my-day");

export const STAFFORD_MEDIA_HOME_PRESENTATION: HomePresentation = {
  workspaceId: "stafford-media",
  heading: "What Deserves Attention",
  summary:
    "Start with the current Stafford Media operating page. It is the working place StaffordOS can use today.",
  primaryAction: actionFromCapability(startMyDay, {
    whatToDo: "Start My Day",
    whyNow:
      "This is the current Home surface for the workday, the main priority, current risks, and business health.",
    expectedResult:
      "You continue in the current operating Home page instead of working from a duplicate view.",
    evidence: "Backed by the current StaffordOS Home page and the S008 capability map.",
    risk: "Live priority ranking is not connected here yet.",
    completionProof: "The current Home page opens and remains the place to continue today.",
  }),
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
    "Not connected yet: live ranking, real action records, AI recommendations, objective tracking, and evidence aggregation.",
};

export const PROFESSIONAL_HOME_PRESENTATION: HomePresentation = {
  workspaceId: "professional",
  heading: "Professional Is Planned",
  summary:
    "This workspace is intended for private career decisions. No professional data is connected yet.",
  primaryAction: null,
  supportingActions: [],
  plannedCapabilities: [
    {
      id: "job-search",
      title: "Job Search",
      summary: "A future private place to compare opportunities, prepare materials, and follow up.",
    },
    {
      id: "my-job",
      title: "My Job",
      summary: "A future private place to protect commitments, capture proof, and prepare for growth.",
    },
  ],
  evidenceNote: "No jobs, applications, resumes, employers, meetings, or recommendations are connected.",
  authorityNote: "Professional is owner-private by design.",
  limitationNote: "Stafford Media is the part of StaffordOS you can use today.",
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
