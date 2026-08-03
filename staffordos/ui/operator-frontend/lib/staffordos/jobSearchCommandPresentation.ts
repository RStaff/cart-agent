import type { StaffordOsWorkspaceId } from "./workspaceRegistry";

export const JOB_COMMAND_WORKSPACE_ID: StaffordOsWorkspaceId = "professional";
export const JOB_COMMAND_ROUTE = "/os/professional/jobs";
export const JOB_COMMAND_TITLE = "Job Command";
export const JOB_COMMAND_PRIMARY_QUESTION = "What should I do next in my job search?";

export type CareerNavigationStatus = "available_now" | "planned";

export type CareerNavigationItem = {
  id: string;
  label: string;
  status: CareerNavigationStatus;
  href: string | null;
  description: string;
};

export type JobCommandSection = {
  id: string;
  title: string;
  state: string;
  summary: string;
};

export type JobCommandHealthItem = {
  id: string;
  label: string;
  state: string;
  detail: string;
};

export type JobCommandPresentation = {
  workspaceId: StaffordOsWorkspaceId;
  title: string;
  primaryQuestion: string;
  summary: string;
  availabilityState: string;
  authorityStatement: string;
  approvalStatement: string;
  primaryAction: {
    label: string;
    state: string;
    headline: string;
    explanation: string[];
    controlLabel: string;
    controlState: string;
    controlNote: string;
  };
  supportingSections: JobCommandSection[];
  searchHealth: JobCommandHealthItem[];
  humanAuthority: {
    summary: string;
    rossMustApprove: string[];
  };
  dataAuthority: {
    available: string[];
    notConnectedYet: string[];
  };
  connectedRecords: {
    opportunities: [];
    applications: [];
    followUps: [];
    interviews: [];
    outcomes: [];
  };
  routeTargets: {
    jobCommand: string;
    opportunities: null;
    applications: null;
    relationships: null;
    interviews: null;
    outcomes: null;
  };
};

export const PROFESSIONAL_CAREER_NAVIGATION: readonly CareerNavigationItem[] = [
  {
    id: "job-command",
    label: "Job Command",
    status: "available_now",
    href: JOB_COMMAND_ROUTE,
    description: "Review what should move next in the job search.",
  },
  {
    id: "opportunities",
    label: "Opportunities",
    status: "planned",
    href: null,
    description: "Job intake will be connected in a later governed slice.",
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
    description: "People and follow-up records are not connected yet.",
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
] as const;

export const JOB_SEARCH_COMMAND_PRESENTATION: JobCommandPresentation = {
  workspaceId: JOB_COMMAND_WORKSPACE_ID,
  title: JOB_COMMAND_TITLE,
  primaryQuestion: JOB_COMMAND_PRIMARY_QUESTION,
  summary:
    "Review the strongest opportunity, the work that needs attention, and anything waiting for Ross's approval.",
  availabilityState: "Read-only shell available",
  authorityStatement:
    "This screen uses a static StaffordOS presentation contract. It does not read live jobs, private files, or external systems.",
  approvalStatement:
    "StaffordOS can prepare, compare, explain, and draft. Ross remains the approval authority for every external action.",
  primaryAction: {
    label: "Primary next action",
    state: "Needs review",
    headline: "Career evidence review is the next foundational step.",
    explanation: [
      "Career source documents have been collected privately.",
      "Candidate facts are not yet canonical.",
      "Ross must review unresolved facts before StaffordOS can safely tailor resumes or compare jobs against verified evidence.",
    ],
    controlLabel: "Review Career Evidence",
    controlState: "Not connected yet",
    controlNote: "Review workflow not connected to this screen yet.",
  },
  supportingSections: [
    {
      id: "strong-opportunities",
      title: "Strong Opportunities",
      state: "No opportunities imported yet.",
      summary: "Job intake will be connected in a later governed slice.",
    },
    {
      id: "applications-requiring-action",
      title: "Applications Requiring Action",
      state: "No application records connected yet.",
      summary: "StaffordOS will not invent applications or imply Ross has applied.",
    },
    {
      id: "follow-ups-due",
      title: "Follow-ups Due",
      state: "No recruiter or follow-up records connected yet.",
      summary: "Future follow-ups will require source evidence and Ross approval before any message is sent.",
    },
    {
      id: "upcoming-interviews",
      title: "Upcoming Interviews",
      state: "No interview records connected yet.",
      summary: "Interview preparation will wait for governed interview records and verified career evidence.",
    },
    {
      id: "recent-outcomes",
      title: "Recent Outcomes",
      state: "No governed outcome records connected yet.",
      summary: "Outcomes will be captured in a later slice without inferring unsupported reasons.",
    },
  ],
  searchHealth: [
    {
      id: "career-evidence-intake",
      label: "Career evidence intake",
      state: "Available privately",
      detail: "Private career source intake exists outside Git and is not read by this screen.",
    },
    {
      id: "career-evidence-review",
      label: "Career evidence review",
      state: "Required",
      detail: "Candidate facts need Ross's review before they become career authority.",
    },
    {
      id: "job-opportunity-intake",
      label: "Job opportunity intake",
      state: "Not connected yet",
      detail: "No live or durable opportunities are connected to this screen.",
    },
    {
      id: "fit-analysis",
      label: "Fit analysis",
      state: "Not connected yet",
      detail: "No requirement-to-evidence comparison is connected.",
    },
    {
      id: "resume-generation",
      label: "Resume generation",
      state: "Not connected yet",
      detail: "No resume generation or tailoring is implemented here.",
    },
    {
      id: "application-tracking",
      label: "Application tracking",
      state: "Not connected yet",
      detail: "No application state or pipeline records are connected.",
    },
    {
      id: "external-submission",
      label: "External submission",
      state: "Ross approval required and not implemented",
      detail: "No application submission, message sending, or external communication is available.",
    },
  ],
  humanAuthority: {
    summary: "StaffordOS can prepare, compare, explain, and draft.",
    rossMustApprove: [
      "resume changes",
      "applications",
      "recruiter messages",
      "interview follow-ups",
      "withdrawals",
      "offer decisions",
      "any final representation made in his name",
    ],
  },
  dataAuthority: {
    available: [
      "private career source intake exists outside Git",
      "read-only Job Command shell",
      "operator approval model",
    ],
    notConnectedYet: [
      "live jobs",
      "job-board search",
      "durable opportunities",
      "requirement extraction",
      "fit assessment",
      "canonical resume facts",
      "application state",
      "recruiters",
      "interviews",
      "outcomes",
      "external AI",
      "automated submissions",
    ],
  },
  connectedRecords: {
    opportunities: [],
    applications: [],
    followUps: [],
    interviews: [],
    outcomes: [],
  },
  routeTargets: {
    jobCommand: JOB_COMMAND_ROUTE,
    opportunities: null,
    applications: null,
    relationships: null,
    interviews: null,
    outcomes: null,
  },
};

export function careerNavigationForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return workspaceId === JOB_COMMAND_WORKSPACE_ID ? PROFESSIONAL_CAREER_NAVIGATION : [];
}

export function getJobSearchCommandPresentation(workspaceId: StaffordOsWorkspaceId) {
  return workspaceId === JOB_COMMAND_WORKSPACE_ID ? JOB_SEARCH_COMMAND_PRESENTATION : null;
}
