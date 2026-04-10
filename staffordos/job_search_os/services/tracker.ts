import type { CandidateProfileRecord } from "../db/candidate_profile_repo";
import type { DraftApplicationRecord, ApplicationApprovalState, ApplicationDraftState, ApplicationQueueGroup } from "../db/applications_repo";
import {
  buildDraftApplicationSummary,
  createDraftApplication,
  fetchApplicationByJobId,
  fetchApplicationsByStatus,
  markApplicationDraftReady,
  updateApplicationApprovalState,
  updateApplicationNotes,
  type CreateDraftApplicationInput,
} from "../db/applications_repo";
import type { JobScoreRecord, JobSearchRecommendation, JobSearchRiskFlag, NormalizedJobRecord } from "../db/jobs_repo";
import type { ResumeBlockRecord } from "../db/resume_blocks_repo";
import {
  prioritizeQueueItem,
  sortPrioritizedItems,
  type NextBestAction,
  type QueuePriority,
} from "./prioritization";
import { tailorResume } from "./tailoring";

export type ScoredJobRecord = NormalizedJobRecord & JobScoreRecord;

export type QueueViewRecord = {
  job_id: string;
  company: string;
  title: string;
  total_score: number;
  recommendation: JobSearchRecommendation;
  strongest_angles: string[];
  risk_flags: JobSearchRiskFlag[];
  draft_state: ApplicationDraftState;
  approval_state: ApplicationApprovalState;
  queue_priority: QueuePriority;
  priority_score: number;
  next_best_action: NextBestAction;
  priority_reasoning: string;
  follow_up_status: string;
  next_follow_up_at: string;
};

export type QueueGroupMap = Record<ApplicationQueueGroup, QueueViewRecord[]>;

export type QueueAction =
  | {
    action: "approve";
    job_id: string;
  }
  | {
    action: "skip";
    job_id: string;
  }
  | {
    action: "mark_draft_ready";
    job_id: string;
  };

export type DraftApplicationArtifactResult = {
  status: "created" | "existing";
  application: DraftApplicationRecord;
  tailored_resume_markdown: string;
  selected_resume_blocks: string[];
  strongest_angles: string[];
  risk_flags: JobSearchRiskFlag[];
  score_reasoning: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export function buildQueueViewRecord(
  job: ScoredJobRecord,
  application?: DraftApplicationRecord | null,
): QueueViewRecord {
  const priority = prioritizeQueueItem(job, application);
  return {
    job_id: job.id,
    company: job.company,
    title: job.title,
    total_score: job.total_score,
    recommendation: job.recommendation,
    strongest_angles: job.strongest_angles || [],
    risk_flags: job.risk_flags || [],
    draft_state: application?.draft_state || "not_started",
    approval_state: application?.approval_state || "pending",
    queue_priority: priority.queue_priority,
    priority_score: priority.priority_score,
    next_best_action: priority.next_best_action,
    priority_reasoning: priority.priority_reasoning,
    follow_up_status: application?.follow_up_status || "none",
    next_follow_up_at: application?.next_follow_up_at || "",
  };
}

export function buildQueueGroups(
  jobs: ScoredJobRecord[],
  applications: DraftApplicationRecord[],
): QueueGroupMap {
  const groups: QueueGroupMap = {
    pursue: [],
    stretch_pursue: [],
    skip: [],
    approved: [],
    pending: [],
    drafted: [],
  };

  const sortedJobs = [...jobs].sort((left, right) =>
    right.total_score - left.total_score
    || left.company.localeCompare(right.company)
    || left.title.localeCompare(right.title)
  );

  const queueRecords = sortPrioritizedItems(sortedJobs.map((job) => {
    const application = fetchApplicationByJobId(applications, job.id);
    return buildQueueViewRecord(job, application);
  }));

  for (const queueRecord of queueRecords) {
    const job = jobs.find((candidate) => candidate.id === queueRecord.job_id)!;
    const approvalGroup = queueRecord.approval_state === "skipped"
      ? "skip"
      : queueRecord.approval_state;

    groups[job.recommendation].push(queueRecord);
    groups[approvalGroup].push(queueRecord);

    if (queueRecord.draft_state === "drafted" || queueRecord.draft_state === "ready") {
      groups.drafted.push(queueRecord);
    }
  }

  return groups;
}

export function filterQueueRecords(
  jobs: ScoredJobRecord[],
  applications: DraftApplicationRecord[],
  group: ApplicationQueueGroup,
) {
  return sortPrioritizedItems(buildQueueGroups(jobs, applications)[group]);
}

export function createDraftApplicationArtifact(input: {
  job: ScoredJobRecord;
  applications: DraftApplicationRecord[];
  canonicalResumeMarkdown: string;
  candidateProfile: CandidateProfileRecord;
  resumeBlocks: ResumeBlockRecord[];
}) : DraftApplicationArtifactResult {
  const tailored = tailorResume({
    canonicalResumeMarkdown: input.canonicalResumeMarkdown,
    candidateProfile: input.candidateProfile,
    resumeBlocks: input.resumeBlocks,
    jobDescription: input.job.description_normalized,
  });

  const draftInput: CreateDraftApplicationInput = {
    job_id: input.job.id,
    company: input.job.company,
    title: input.job.title,
    recommendation: input.job.recommendation,
    approval_state: "pending",
    draft_state: "drafted",
    tailored_resume_markdown: tailored.tailoredResumeMarkdown,
    selected_resume_blocks: tailored.selectedBlocks.map((block) => block.block_key),
    strongest_angles: input.job.strongest_angles,
    risk_flags: input.job.risk_flags,
    score_reasoning: input.job.score_reasoning,
    notes: "",
  };

  const result = createDraftApplication(input.applications, draftInput);

  return {
    status: result.status,
    application: result.application,
    tailored_resume_markdown: tailored.tailoredResumeMarkdown,
    selected_resume_blocks: tailored.selectedBlocks.map((block) => block.block_key),
    strongest_angles: input.job.strongest_angles,
    risk_flags: input.job.risk_flags,
    score_reasoning: input.job.score_reasoning,
  };
}

export function applyQueueAction(
  applications: DraftApplicationRecord[],
  action: QueueAction,
) {
  const existing = fetchApplicationByJobId(applications, action.job_id);

  if (!existing) {
    throw new Error("application_not_found_for_job");
  }

  if (action.action === "approve") {
    return updateApplicationApprovalState(existing, "approved");
  }

  if (action.action === "skip") {
    return updateApplicationApprovalState(existing, "skipped");
  }

  return markApplicationDraftReady(existing);
}

export function updateDraftApplicationNotesForJob(
  applications: DraftApplicationRecord[],
  jobId: string,
  notes: string,
) {
  const existing = fetchApplicationByJobId(applications, jobId);

  if (!existing) {
    throw new Error("application_not_found_for_notes");
  }

  return updateApplicationNotes(existing, notes);
}

export function buildApplicationsIndex(applications: DraftApplicationRecord[]) {
  return {
    by_job_id: Object.fromEntries(
      applications.map((application) => [application.job_id, buildDraftApplicationSummary(application)]),
    ),
    approved: fetchApplicationsByStatus(applications, "approved").map(buildDraftApplicationSummary),
    pending: fetchApplicationsByStatus(applications, "pending").map(buildDraftApplicationSummary),
    drafted: fetchApplicationsByStatus(applications, "drafted").map(buildDraftApplicationSummary),
  };
}
