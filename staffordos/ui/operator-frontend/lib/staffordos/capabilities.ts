import type { StaffordOsSectionKey } from "./workspaces";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  type StaffordOsWorkspaceId,
} from "./workspaceRegistry";

export type CapabilityAvailability =
  | "available_now"
  | "partially_available"
  | "planned"
  | "needs_review";

export type CapabilityAccess = "read_only" | "action_capable";

export type CapabilityAuthority =
  | "current_staffordos_page"
  | "current_evidence_page"
  | "current_guided_action_page"
  | "planned_staffordos_page";

export type CapabilitySource = "repository_backed" | "planned_architecture";

export type StaffordOsCapability = {
  id: string;
  workspaceId: StaffordOsWorkspaceId;
  source: CapabilitySource;
  title: string;
  description: string;
  operatorQuestion: string;
  currentRoute: string | null;
  destinationLabel: string;
  osSection: StaffordOsSectionKey;
  availability: CapabilityAvailability;
  authority: CapabilityAuthority;
  access: CapabilityAccess;
  readiness: string;
  technicalNote?: string;
};

export const AVAILABILITY_LABELS: Record<CapabilityAvailability, string> = {
  available_now: "Available now",
  partially_available: "Partially available",
  planned: "Planned",
  needs_review: "Needs review",
};

export const ACCESS_LABELS: Record<CapabilityAccess, string> = {
  read_only: "Read-only view",
  action_capable: "Opens guided actions",
};

export const AUTHORITY_LABELS: Record<CapabilityAuthority, string> = {
  current_staffordos_page: "Backed by a current StaffordOS page",
  current_evidence_page: "Backed by current evidence",
  current_guided_action_page: "Backed by an existing guided workflow",
  planned_staffordos_page: "Planned for StaffordOS",
};

export const SOURCE_LABELS: Record<CapabilitySource, string> = {
  repository_backed: "Available from current StaffordOS pages",
  planned_architecture: "Planned workspace capability",
};

export const STAFFORDOS_CAPABILITIES: StaffordOsCapability[] = [
  {
    id: "start-my-day",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "Start My Day",
    description: "See the main priority, current risks, business health, and the workday controls from the existing home surface.",
    operatorQuestion: "What should I do first today?",
    currentRoute: "/operator",
    destinationLabel: "Opens the current Home page",
    osSection: "home",
    availability: "available_now",
    authority: "current_guided_action_page",
    access: "action_capable",
    readiness: "Ready to use from the current StaffordOS home page.",
    technicalNote: "Current route: /operator.",
  },
  {
    id: "decide-what-matters",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "Decide What Matters",
    description: "Review the company priority view and see the highest-value decision before getting pulled into detail.",
    operatorQuestion: "Which decision matters most right now?",
    currentRoute: "/operator/cockpit",
    destinationLabel: "Opens the current priority view",
    osSection: "command",
    availability: "partially_available",
    authority: "current_guided_action_page",
    access: "action_capable",
    readiness: "Useful today, but S008.01 says this needs to merge into the future Command section.",
    technicalNote: "Current route: /operator/cockpit.",
  },
  {
    id: "find-people-to-contact",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "Find People to Contact",
    description: "Review leads, contact readiness, outreach state, and the next person who needs attention.",
    operatorQuestion: "Who should I contact next?",
    currentRoute: "/operator/leads",
    destinationLabel: "Opens the current people-to-contact page",
    osSection: "pipeline",
    availability: "available_now",
    authority: "current_guided_action_page",
    access: "action_capable",
    readiness: "Ready to use; the existing page includes current lead actions.",
    technicalNote: "Current route: /operator/leads.",
  },
  {
    id: "review-marketing-activity",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "Review Marketing Activity",
    description: "See active outreach motions, campaign health, and which marketing work is warm, stuck, or dormant.",
    operatorQuestion: "Which marketing motion should move next?",
    currentRoute: "/operator/campaigns",
    destinationLabel: "Opens the current marketing activity page",
    osSection: "pipeline",
    availability: "available_now",
    authority: "current_staffordos_page",
    access: "read_only",
    readiness: "Ready to inspect; deeper campaign detail is still future work.",
    technicalNote: "Current route: /operator/campaigns.",
  },
  {
    id: "see-money-to-collect",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "See Money to Collect",
    description: "Find offers, payment waits, warm opportunities, and the clearest revenue-moving follow-up.",
    operatorQuestion: "Where is money closest to being collected?",
    currentRoute: "/operator/revenue-command",
    destinationLabel: "Opens the current money-to-collect page",
    osSection: "pipeline",
    availability: "available_now",
    authority: "current_staffordos_page",
    access: "read_only",
    readiness: "Ready to inspect; it preserves captured revenue separately from estimates.",
    technicalNote: "Current route: /operator/revenue-command.",
  },
  {
    id: "manage-current-customer-work",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "Manage Current Customer Work",
    description: "Review active customer work, proof readiness, delivery blockers, and current ShopiFixer progress without duplicating the work surface.",
    operatorQuestion: "What customer work is moving, blocked, or waiting?",
    currentRoute: "/operator/command-center",
    destinationLabel: "Opens the current customer-work surface",
    osSection: "work",
    availability: "partially_available",
    authority: "current_guided_action_page",
    access: "action_capable",
    readiness: "Useful today, but S008.01 says this page is mixed-purpose and should migrate carefully.",
    technicalNote: "Current route: /operator/command-center.",
  },
  {
    id: "review-recent-activity",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "Review Recent Activity",
    description: "Look back at completed work, outcomes, rule suggestions, and system events that should inform the next decision.",
    operatorQuestion: "What changed recently?",
    currentRoute: "/operator/execution-log",
    destinationLabel: "Opens the current recent-activity page",
    osSection: "knowledge",
    availability: "available_now",
    authority: "current_evidence_page",
    access: "read_only",
    readiness: "Ready to inspect as an evidence view.",
    technicalNote: "Current route: /operator/execution-log.",
  },
  {
    id: "understand-system-connections",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "Understand System Connections",
    description: "See how StaffordOS pages, checks, products, and evidence sources fit together.",
    operatorQuestion: "How does this part of the business connect to the rest?",
    currentRoute: "/operator/system-map",
    destinationLabel: "Opens the current system-connections page",
    osSection: "system",
    availability: "available_now",
    authority: "current_evidence_page",
    access: "read_only",
    readiness: "Ready to inspect; some deeper details remain technical by nature.",
    technicalNote: "Current route: /operator/system-map.",
  },
  {
    id: "review-rules-and-checks",
    workspaceId: "stafford-media",
    source: "repository_backed",
    title: "Review Rules and Checks",
    description: "Review current operating rules, checks, and lock status before making governed changes.",
    operatorQuestion: "What rules or checks could stop this work?",
    currentRoute: "/operator/slice-truth",
    destinationLabel: "Opens the current rules-and-checks page",
    osSection: "governance",
    availability: "partially_available",
    authority: "current_evidence_page",
    access: "read_only",
    readiness: "Available as a current evidence surface; it needs clearer future integration into Governance.",
    technicalNote: "Current route: /operator/slice-truth.",
  },
  {
    id: "professional-career-home",
    workspaceId: "professional",
    source: "repository_backed",
    title: "Professional Career Home",
    description: "See how Professional supports finding work now and succeeding at work later without connecting private records.",
    operatorQuestion: "What deserves my attention in my professional life?",
    currentRoute: "/os/professional",
    destinationLabel: "Opens the Professional Career Home",
    osSection: "home",
    availability: "available_now",
    authority: "current_staffordos_page",
    access: "read_only",
    readiness: "Available as a static, read-only foundation. No private Professional records are connected.",
    technicalNote: "Current route: /os/professional.",
  },
  {
    id: "professional-job-search",
    workspaceId: "professional",
    source: "repository_backed",
    title: "Job Search",
    description: "Use the Job Command foundation to see what is connected, what needs Ross's review, and what is not connected yet.",
    operatorQuestion: "What should I do next in my job search?",
    currentRoute: "/os/professional/jobs",
    destinationLabel: "Opens Job Command",
    osSection: "pipeline",
    availability: "available_now",
    authority: "current_staffordos_page",
    access: "read_only",
    readiness: "Available at the read-only foundation level. Live job automation and application tracking are not connected.",
    technicalNote: "Current route: /os/professional/jobs.",
  },
  {
    id: "professional-application-materials",
    workspaceId: "professional",
    source: "planned_architecture",
    title: "Prepare Career Materials",
    description: "A future private place to choose approved resumes, notes, and role-specific materials.",
    operatorQuestion: "What should I prepare before I apply or follow up?",
    currentRoute: null,
    destinationLabel: "Stays in this planned overview",
    osSection: "work",
    availability: "planned",
    authority: "planned_staffordos_page",
    access: "read_only",
    readiness: "Planned only. No resume, employer, or application data is connected.",
  },
  {
    id: "professional-interview-prep",
    workspaceId: "professional",
    source: "planned_architecture",
    title: "Prepare for Interviews",
    description: "A future private place to organize interview notes, risks, and follow-up proof.",
    operatorQuestion: "What should I do before the next conversation?",
    currentRoute: null,
    destinationLabel: "Stays in this planned overview",
    osSection: "command",
    availability: "planned",
    authority: "planned_staffordos_page",
    access: "read_only",
    readiness: "Planned only. StaffordOS does not create interview claims or communications here.",
  },
  {
    id: "professional-current-role",
    workspaceId: "professional",
    source: "planned_architecture",
    title: "My Job",
    description: "A future private place to track commitments, stakeholders, accomplishments, and lessons after Ross confirms a work transition.",
    operatorQuestion: "What should I do next to succeed in my role?",
    currentRoute: null,
    destinationLabel: "Stays in this planned overview",
    osSection: "knowledge",
    availability: "planned",
    authority: "planned_staffordos_page",
    access: "read_only",
    readiness: "Planned only. No employer data is connected.",
  },
  {
    id: "personal-private-planning",
    workspaceId: "personal",
    source: "planned_architecture",
    title: "Choose a Private Priority",
    description: "A future private place to decide what personal work deserves attention next.",
    operatorQuestion: "What personal priority should I choose next?",
    currentRoute: null,
    destinationLabel: "Stays in this planned overview",
    osSection: "home",
    availability: "planned",
    authority: "planned_staffordos_page",
    access: "read_only",
    readiness: "Planned only. No private tasks or notes are connected.",
  },
  {
    id: "personal-learning",
    workspaceId: "personal",
    source: "planned_architecture",
    title: "Plan Learning",
    description: "A future private place to organize learning goals, lessons, and practice.",
    operatorQuestion: "What should I learn or practice next?",
    currentRoute: null,
    destinationLabel: "Stays in this planned overview",
    osSection: "knowledge",
    availability: "planned",
    authority: "planned_staffordos_page",
    access: "read_only",
    readiness: "Planned only. No learning records are connected.",
  },
  {
    id: "personal-family",
    workspaceId: "personal",
    source: "planned_architecture",
    title: "Plan Family Time",
    description: "A future selectively shared place for approved family plans and activities.",
    operatorQuestion: "What family activity should be planned next?",
    currentRoute: null,
    destinationLabel: "Stays in this planned overview",
    osSection: "work",
    availability: "planned",
    authority: "planned_staffordos_page",
    access: "read_only",
    readiness: "Planned only. No family members, invitations, or shared items are connected.",
  },
  {
    id: "personal-media",
    workspaceId: "personal",
    source: "planned_architecture",
    title: "Plan Media and Creative Work",
    description: "A future selectively shared place for approved media watching, creation, and memories.",
    operatorQuestion: "What should I watch, make, or preserve next?",
    currentRoute: null,
    destinationLabel: "Stays in this planned overview",
    osSection: "knowledge",
    availability: "planned",
    authority: "planned_staffordos_page",
    access: "read_only",
    readiness: "Planned only. No media library, upload, generation, or sharing is connected.",
  },
];

export function capabilitiesForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return STAFFORDOS_CAPABILITIES.filter((capability) => capability.workspaceId === workspaceId);
}

export function capabilitiesForWorkspaceSection(workspaceId: StaffordOsWorkspaceId, sectionKey: StaffordOsSectionKey) {
  return capabilitiesForWorkspace(workspaceId).filter((capability) => capability.osSection === sectionKey);
}

export function capabilitiesForSection(sectionKey: StaffordOsSectionKey) {
  return capabilitiesForWorkspaceSection(DEFAULT_STAFFORDOS_WORKSPACE_ID, sectionKey);
}
