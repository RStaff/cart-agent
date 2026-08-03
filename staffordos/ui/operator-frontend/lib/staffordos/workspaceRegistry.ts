import type { StaffordOsSectionKey } from "./workspaces";

export type StaffordOsWorkspaceId = "stafford-media" | "professional" | "personal";

export type StaffordOsWorkspaceFamily = "business" | "professional" | "personal";

export type StaffordOsWorkspaceAvailability = "available_now" | "planned" | "needs_review";

export type StaffordOsWorkspace = {
  id: StaffordOsWorkspaceId;
  name: string;
  shortDescription: string;
  family: StaffordOsWorkspaceFamily;
  availability: StaffordOsWorkspaceAvailability;
  ownerAccess: string;
  invitedAccess: string;
  enabledSections: StaffordOsSectionKey[];
  enabledCapabilities: string[];
  languageProfile: string;
  privacyClassification: string;
  currentAuthorityStatus: string;
  supportedModes?: string[];
  currentDefaultMode?: string;
  modeLabels?: string[];
  limitations?: string[];
  plannedModes?: string[];
  futureCapabilityGroups?: string[];
};

export const DEFAULT_STAFFORDOS_WORKSPACE_ID: StaffordOsWorkspaceId = "stafford-media";

export const WORKSPACE_AVAILABILITY_LABELS: Record<StaffordOsWorkspaceAvailability, string> = {
  available_now: "Available now",
  planned: "Planned",
  needs_review: "Needs review",
};

export const STAFFORDOS_WORKSPACES: StaffordOsWorkspace[] = [
  {
    id: "stafford-media",
    name: "Stafford Media",
    shortDescription: "Run the current Stafford Media operating work from the existing StaffordOS pages.",
    family: "business",
    availability: "available_now",
    ownerAccess: "Owner can use this workspace today.",
    invitedAccess: "Owner-private unless Business access is explicitly granted later.",
    enabledSections: ["home", "command", "work", "pipeline", "knowledge", "governance", "system"],
    enabledCapabilities: [
      "start-my-day",
      "decide-what-matters",
      "find-people-to-contact",
      "review-marketing-activity",
      "see-money-to-collect",
      "manage-current-customer-work",
      "review-recent-activity",
      "understand-system-connections",
      "review-rules-and-checks",
    ],
    languageProfile: "Business owner operating Stafford Media.",
    privacyClassification: "Owner-private unless Business access is explicitly granted later.",
    currentAuthorityStatus: "Current operating workspace.",
  },
  {
    id: "professional",
    name: "Professional",
    shortDescription: "Manage private career work for finding work now and succeeding at work later.",
    family: "professional",
    availability: "available_now",
    ownerAccess: "Owner can use the read-only Professional foundation today.",
    invitedAccess: "No invited access planned by default.",
    enabledSections: ["home", "command", "work", "pipeline", "knowledge", "governance", "system"],
    enabledCapabilities: [
      "professional-career-home",
      "professional-job-search",
      "professional-application-materials",
      "professional-interview-prep",
      "professional-current-role",
    ],
    languageProfile: "Private Professional planning across Job Search and My Job.",
    privacyClassification: "Owner-private.",
    currentAuthorityStatus:
      "Foundation available: Career Home, Job Command, and local intake bridge; live Professional records and access controls are not connected.",
    supportedModes: ["CAREER_HOME", "JOB_SEARCH", "MY_JOB"],
    currentDefaultMode: "CAREER_HOME",
    modeLabels: ["Career Home", "Job Search", "My Job"],
    limitations: [
      "Private Professional records remain outside Git.",
      "My Job is planned and has no runtime records.",
      "Workspace selection changes presentation only.",
    ],
  },
  {
    id: "personal",
    name: "Personal",
    shortDescription: "Plan private life, learning, family, and media work with optional sharing later.",
    family: "personal",
    availability: "planned",
    ownerAccess: "Owner-only placeholder.",
    invitedAccess: "Future sharing must be explicit by capability and invitation.",
    enabledSections: ["home", "command", "work", "pipeline", "knowledge", "governance", "system"],
    enabledCapabilities: [
      "personal-private-planning",
      "personal-learning",
      "personal-family",
      "personal-media",
    ],
    languageProfile: "Private personal planning with optional sharing later.",
    privacyClassification: "Owner-private by default.",
    currentAuthorityStatus: "Architecture defined; no runtime workflow yet.",
    futureCapabilityGroups: ["private planning", "learning", "family", "media", "creation", "memories", "governed learner access"],
  },
];

export function workspaceById(workspaceId: string | null | undefined) {
  return STAFFORDOS_WORKSPACES.find((workspace) => workspace.id === workspaceId) || STAFFORDOS_WORKSPACES[0];
}

export function isWorkspaceAvailableNow(workspace: StaffordOsWorkspace) {
  return workspace.availability === "available_now";
}
