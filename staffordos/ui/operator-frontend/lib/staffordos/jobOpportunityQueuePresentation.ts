import type { StaffordOsWorkspaceId } from "./workspaceRegistry";
import type { PrivateNormalizedJobOpportunity } from "./privateJobOpportunityIntake";

export const JOB_OPPORTUNITY_QUEUE_PRESENTATION_VERSION = "J001.02";
export const JOB_OPPORTUNITY_QUEUE_WORKSPACE_ID: StaffordOsWorkspaceId = "professional";

export type JobOpportunityQueueItem = {
  id: string;
  role: string;
  company: string;
  location: string;
  workArrangement: string;
  compensation: string;
  freshness: string;
  sourceStatus: string;
  reviewStatus: "Needs Ross's review";
  nextAction: "Review opportunity";
  approvalStatus: string;
  limitations: string[];
  detailTarget: null;
};

export type JobOpportunityQueuePresentation = {
  workspaceId: StaffordOsWorkspaceId;
  title: "Opportunities to Review";
  state: string;
  summary: string;
  opportunities: JobOpportunityQueueItem[];
  emptyState: {
    title: "No opportunities imported yet.";
    summary: "Job intake will be connected in a later governed slice.";
  };
  disclosure: {
    sourceTextVisible: false;
    privatePathsVisible: false;
    contactDetailsVisible: false;
    fitClaimVisible: false;
    applicationActionVisible: false;
    messageActionVisible: false;
  };
};

export const EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION: JobOpportunityQueuePresentation = {
  workspaceId: JOB_OPPORTUNITY_QUEUE_WORKSPACE_ID,
  title: "Opportunities to Review",
  state: "No opportunities imported yet.",
  summary: "Local intake can validate private opportunities, but no validated opportunity is connected to this screen.",
  opportunities: [],
  emptyState: {
    title: "No opportunities imported yet.",
    summary: "Job intake will be connected in a later governed slice.",
  },
  disclosure: {
    sourceTextVisible: false,
    privatePathsVisible: false,
    contactDetailsVisible: false,
    fitClaimVisible: false,
    applicationActionVisible: false,
    messageActionVisible: false,
  },
};

function displayValue(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value.trim() : fallback;
}

function freshnessLabel(opportunity: PrivateNormalizedJobOpportunity) {
  if (opportunity.listingFreshness === "STALE") return "Source may be stale";
  if (opportunity.listingFreshness === "UNKNOWN") return "Listing date unknown";
  if (opportunity.listingFreshness === "HISTORICAL") return "Historical source";
  if (opportunity.listingFreshness === "RECENT") return "Recently observed";
  return "Needs verification";
}

function sourceStatusLabel(opportunity: PrivateNormalizedJobOpportunity) {
  if (opportunity.duplicateStatus === "EXACT_SOURCE_DUPLICATE") return "Possible duplicate source";
  if (opportunity.duplicateStatus === "SAME_PROVIDER_ALIAS") return "Provider alias needs review";
  if (opportunity.duplicateStatus === "POSSIBLE_CONTENT_DUPLICATE") return "Possible duplicate wording";
  if (opportunity.duplicateStatus === "POSSIBLE_ROLE_VARIANT") return "Possible role variant";
  if (opportunity.duplicateStatus === "DISTINCT_OPPORTUNITY") return "Distinct source candidate";
  return "Needs review";
}

export function buildJobOpportunityQueuePresentation(
  opportunities: readonly PrivateNormalizedJobOpportunity[] = [],
  workspaceId: StaffordOsWorkspaceId = JOB_OPPORTUNITY_QUEUE_WORKSPACE_ID,
): JobOpportunityQueuePresentation {
  if (workspaceId !== JOB_OPPORTUNITY_QUEUE_WORKSPACE_ID) {
    return {
      ...EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION,
      workspaceId,
      summary: "Professional Job Search opportunities are not shown in this workspace.",
      opportunities: [],
    };
  }

  const queueItems = opportunities
    .filter((opportunity) => opportunity.workspaceId === JOB_OPPORTUNITY_QUEUE_WORKSPACE_ID)
    .map((opportunity): JobOpportunityQueueItem => {
      return {
        id: opportunity.id,
        role: opportunity.roleTitle,
        company: opportunity.companyName,
        location: displayValue(opportunity.locationText, "Location not provided"),
        workArrangement: displayValue(opportunity.workArrangement, "Work arrangement not provided"),
        compensation: displayValue(opportunity.compensationText, "Compensation not provided"),
        freshness: freshnessLabel(opportunity),
        sourceStatus: sourceStatusLabel(opportunity),
        reviewStatus: "Needs Ross's review",
        nextAction: "Review opportunity",
        approvalStatus: opportunity.approvalStatus,
        limitations: [...opportunity.limitations],
        detailTarget: null,
      };
    })
    .sort((a, b) => a.role.localeCompare(b.role) || a.company.localeCompare(b.company) || a.id.localeCompare(b.id));

  if (!queueItems.length) {
    return EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION;
  }

  return {
    ...EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION,
    state: `${queueItems.length} opportunity${queueItems.length === 1 ? "" : "ies"} waiting for Ross's review.`,
    summary: "Validated private opportunities are shown read-only. StaffordOS has not ranked them or prepared an application.",
    opportunities: queueItems,
  };
}
