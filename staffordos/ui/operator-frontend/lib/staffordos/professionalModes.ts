import type { StaffordOsWorkspaceId } from "./workspaceRegistry";

export const PROFESSIONAL_WORKSPACE_ID: StaffordOsWorkspaceId = "professional";
export const PROFESSIONAL_CAREER_HOME_ROUTE = "/os/professional";
export const PROFESSIONAL_JOB_COMMAND_ROUTE = "/os/professional/jobs";

export type ProfessionalModeId = "CAREER_HOME" | "JOB_SEARCH" | "MY_JOB";
export type ProfessionalModeAvailability = "available_now" | "planned";

export type ProfessionalMode = {
  modeId: ProfessionalModeId;
  workspaceId: typeof PROFESSIONAL_WORKSPACE_ID;
  name: string;
  summary: string;
  availability: ProfessionalModeAvailability;
  route: string | null;
  capabilities: string[];
  retainedRecords: string[];
  plannedFeatures: string[];
  limitations: string[];
  operatorQuestion: string;
};

export type ProfessionalModeTransition = {
  from: ProfessionalModeId;
  to: ProfessionalModeId;
  permitted: true;
  rossConfirmationRequired: boolean;
  result: string;
};

export type ProfessionalNavigationStatus = "available_now" | "planned" | "not_connected_yet";

export type ProfessionalNavigationItem = {
  id: string;
  label: string;
  status: ProfessionalNavigationStatus;
  href: string | null;
  description: string;
};

export const PROFESSIONAL_RETAINED_RECORDS = [
  "CareerFact",
  "CareerEvidence",
  "ResumeVersion",
  "Achievement",
  "Project",
  "Skill and technology context",
  "Certification",
  "Education",
  "Professional Relationship",
  "Decision",
  "Action",
  "Evidence",
  "Proof",
  "Learning",
  "Asset reference",
  "Job Outcome",
  "employment history",
] as const;

export const JOB_SEARCH_SPECIFIC_RECORDS = [
  "JobOpportunity",
  "JobRequirement",
  "Application",
  "Interview",
  "recruiter follow-up",
  "offer",
  "rejection",
  "withdrawal",
] as const;

export const MY_JOB_FUTURE_RECORDS = [
  "Employment",
  "Role Responsibility",
  "Objective",
  "Work Project",
  "Commitment",
  "Meeting reference",
  "Manager or coworker relationship",
  "Accomplishment",
  "Feedback",
  "Performance Review",
  "Promotion Goal",
  "Compensation event",
] as const;

export const PROFESSIONAL_MODE_TRANSITION_RULES = [
  "A mode change does not delete records.",
  "Job opportunities and applications can become historical or less active, but they are not erased.",
  "Career evidence survives mode changes.",
  "Resume authority survives mode changes.",
  "Professional relationships survive mode changes.",
  "Achievements survive mode changes.",
  "Learning survives mode changes.",
  "Decisions and outcomes survive mode changes.",
  "Employment records remain separate from applications.",
  "A job offer does not automatically activate My Job.",
  "Ross explicitly confirms an employment transition.",
  "Changing presentation mode does not grant access or permission.",
] as const;

export const PROFESSIONAL_MODES: readonly ProfessionalMode[] = [
  {
    modeId: "CAREER_HOME",
    workspaceId: PROFESSIONAL_WORKSPACE_ID,
    name: "Career Home",
    summary:
      "A single Professional overview across career history, current priorities, learning, achievements, and relationships.",
    availability: "available_now",
    route: PROFESSIONAL_CAREER_HOME_ROUTE,
    capabilities: ["professional-career-home", "professional-job-search"],
    retainedRecords: [...PROFESSIONAL_RETAINED_RECORDS],
    plannedFeatures: [
      "career evidence review connection",
      "professional history overview",
      "achievement review",
      "learning review",
      "relationship review",
    ],
    limitations: [
      "Static and read-only foundation only.",
      "No private Professional records are connected.",
      "No live prioritization is connected.",
    ],
    operatorQuestion: "What deserves my attention in my professional life?",
  },
  {
    modeId: "JOB_SEARCH",
    workspaceId: PROFESSIONAL_WORKSPACE_ID,
    name: "Job Search",
    summary: "Find, evaluate, pursue, and learn from employment opportunities.",
    availability: "available_now",
    route: PROFESSIONAL_JOB_COMMAND_ROUTE,
    capabilities: ["professional-job-search"],
    retainedRecords: [...PROFESSIONAL_RETAINED_RECORDS, ...JOB_SEARCH_SPECIFIC_RECORDS],
    plannedFeatures: [
      "opportunity queue connection",
      "requirement extraction",
      "career evidence mapping",
      "application tracking",
      "interview preparation",
      "outcome learning",
    ],
    limitations: [
      "Available now at the Job Command foundation level.",
      "No live job automation is connected.",
      "No application submission is implemented.",
    ],
    operatorQuestion: "What should I do next in my job search?",
  },
  {
    modeId: "MY_JOB",
    workspaceId: PROFESSIONAL_WORKSPACE_ID,
    name: "My Job",
    summary: "Help Ross succeed after accepting employment.",
    availability: "planned",
    route: null,
    capabilities: ["professional-current-role"],
    retainedRecords: [...PROFESSIONAL_RETAINED_RECORDS, ...MY_JOB_FUTURE_RECORDS],
    plannedFeatures: [
      "employment record",
      "role responsibilities",
      "work objectives",
      "commitments",
      "manager and coworker relationships",
      "feedback",
      "performance review preparation",
      "promotion goals",
    ],
    limitations: [
      "Planned only.",
      "No employer, manager, coworker, goal, meeting, review, or compensation record exists.",
      "Ross decides when his work status changes.",
    ],
    operatorQuestion: "What should I do next to succeed in my role?",
  },
] as const;

export const PROFESSIONAL_MODE_TRANSITIONS: readonly ProfessionalModeTransition[] = [
  {
    from: "CAREER_HOME",
    to: "JOB_SEARCH",
    permitted: true,
    rossConfirmationRequired: false,
    result: "Shows the Job Search foundation without deleting Professional records.",
  },
  {
    from: "JOB_SEARCH",
    to: "MY_JOB",
    permitted: true,
    rossConfirmationRequired: true,
    result: "Requires Ross to confirm an employment transition; a job offer alone does not switch modes.",
  },
  {
    from: "MY_JOB",
    to: "JOB_SEARCH",
    permitted: true,
    rossConfirmationRequired: true,
    result: "Preserves employment history while making Job Search active again.",
  },
  {
    from: "MY_JOB",
    to: "CAREER_HOME",
    permitted: true,
    rossConfirmationRequired: false,
    result: "Returns to the Professional overview without deleting role history.",
  },
  {
    from: "JOB_SEARCH",
    to: "CAREER_HOME",
    permitted: true,
    rossConfirmationRequired: false,
    result: "Returns to the Professional overview without deleting opportunities or outcomes.",
  },
] as const;

export const PROFESSIONAL_NAVIGATION: readonly ProfessionalNavigationItem[] = [
  {
    id: "career-home",
    label: "Career Home",
    status: "available_now",
    href: PROFESSIONAL_CAREER_HOME_ROUTE,
    description: "See how Professional supports finding work and succeeding at work.",
  },
  {
    id: "job-command",
    label: "Job Command",
    status: "available_now",
    href: PROFESSIONAL_JOB_COMMAND_ROUTE,
    description: "Review what should move next in the job search.",
  },
  {
    id: "opportunities",
    label: "Opportunities",
    status: "planned",
    href: null,
    description: "Opportunity queue connection is planned.",
  },
  {
    id: "applications",
    label: "Applications",
    status: "planned",
    href: null,
    description: "Application records are not connected yet.",
  },
  {
    id: "relationships",
    label: "Relationships",
    status: "planned",
    href: null,
    description: "Recruiter, referral, and work relationships are not connected yet.",
  },
  {
    id: "interviews",
    label: "Interviews",
    status: "planned",
    href: null,
    description: "Interview records are not connected yet.",
  },
  {
    id: "outcomes",
    label: "Outcomes",
    status: "planned",
    href: null,
    description: "Governed outcome records are not connected yet.",
  },
  {
    id: "my-job",
    label: "My Job",
    status: "planned",
    href: null,
    description: "Succeeding in a role is planned after Ross confirms a work transition.",
  },
  {
    id: "career-evidence",
    label: "Career Evidence",
    status: "not_connected_yet",
    href: null,
    description: "Private career evidence exists outside Git and is not connected to UI yet.",
  },
  {
    id: "achievements",
    label: "Achievements",
    status: "planned",
    href: null,
    description: "Achievement review is planned.",
  },
  {
    id: "learning",
    label: "Learning",
    status: "planned",
    href: null,
    description: "Professional learning review is planned.",
  },
] as const;

export function professionalModesForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return workspaceId === PROFESSIONAL_WORKSPACE_ID ? PROFESSIONAL_MODES : [];
}

export function professionalModeById(modeId: ProfessionalModeId) {
  return PROFESSIONAL_MODES.find((mode) => mode.modeId === modeId) || null;
}

export function professionalNavigationForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return workspaceId === PROFESSIONAL_WORKSPACE_ID ? PROFESSIONAL_NAVIGATION : [];
}

export function permittedProfessionalTransitions(from: ProfessionalModeId) {
  return PROFESSIONAL_MODE_TRANSITIONS.filter((transition) => transition.from === from);
}

export function transitionRequiresRossConfirmation(from: ProfessionalModeId, to: ProfessionalModeId) {
  const transition = PROFESSIONAL_MODE_TRANSITIONS.find((candidate) => candidate.from === from && candidate.to === to);
  return transition ? transition.rossConfirmationRequired : true;
}

export function professionalModeTransitionDeletesRecords() {
  return false;
}
