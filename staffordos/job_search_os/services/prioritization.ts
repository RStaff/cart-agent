import type { DraftApplicationRecord } from "../db/applications_repo";
import type {
  JobSearchRecommendation,
  JobSearchRiskFlag,
  NormalizedJobRecord,
} from "../db/jobs_repo";

export const QUEUE_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export const NEXT_BEST_ACTIONS = [
  "review_job",
  "create_draft",
  "review_draft",
  "approve_draft",
  "mark_ready",
  "submit_application",
  "generate_follow_up",
  "send_follow_up",
  "generate_outreach",
  "review_outreach",
  "skip_role",
  "no_action",
] as const;

export type QueuePriority = typeof QUEUE_PRIORITIES[number];
export type NextBestAction = typeof NEXT_BEST_ACTIONS[number];

export type PrioritizedQueueState = {
  queue_priority: QueuePriority;
  priority_score: number;
  next_best_action: NextBestAction;
  priority_reasoning: string;
};

type PrioritizableJobRecord = Pick<
  NormalizedJobRecord,
  "id" | "company" | "title"
> & {
  recommendation?: JobSearchRecommendation;
  total_score?: number;
  risk_flags?: JobSearchRiskFlag[];
};

const SEVERE_RISKS: JobSearchRiskFlag[] = [
  "compensation_below_floor",
  "too_junior",
  "onsite_constraint",
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function daysSince(value: string) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed) / 86400000));
}

function daysUntil(value: string) {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor((parsed - Date.now()) / 86400000);
}

function recommendationWeight(recommendation?: JobSearchRecommendation) {
  if (recommendation === "pursue") return 28;
  if (recommendation === "stretch_pursue") return 16;
  return -24;
}

function bucketPriority(score: number): QueuePriority {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function severeRiskPenalty(riskFlags: JobSearchRiskFlag[]) {
  return riskFlags.some((flag) => SEVERE_RISKS.includes(flag)) ? 18 : 0;
}

function stalePenalty(application?: DraftApplicationRecord | null) {
  if (!application) return 0;
  const age = daysSince(application.updated_at || application.created_at);
  if (age >= 10) return 10;
  if (age >= 5) return 4;
  return 0;
}

function followUpPriority(application?: DraftApplicationRecord | null) {
  if (!application) {
    return { score: 0, reason: "", action: null as NextBestAction | null };
  }

  const dueInDays = daysUntil(application.next_follow_up_at);
  if (application.follow_up_status === "due" && dueInDays !== null && dueInDays <= 0) {
    return { score: 40, reason: "Follow-up due today", action: "send_follow_up" as NextBestAction };
  }

  if (application.follow_up_status === "due") {
    return { score: 28, reason: "Follow-up due soon", action: "generate_follow_up" as NextBestAction };
  }

  return { score: 0, reason: "", action: null as NextBestAction | null };
}

function actionablePriority(
  job: PrioritizableJobRecord,
  application?: DraftApplicationRecord | null,
) {
  if (!application) {
    if (job.recommendation === "skip") {
      return { score: 0, action: "skip_role" as NextBestAction, reason: "Low priority due to skip recommendation" };
    }

    if (Number(job.total_score || 0) >= 80) {
      return { score: 24, action: "create_draft" as NextBestAction, reason: "High-score pursue role with no draft yet" };
    }

    if (job.recommendation === "stretch_pursue") {
      return { score: 14, action: "review_job" as NextBestAction, reason: "Stretch role worth review before drafting" };
    }

    return { score: 10, action: "review_job" as NextBestAction, reason: "Role needs review" };
  }

  if (application.submission_state === "submitted" && application.follow_up_status === "due") {
    return { score: 36, action: "send_follow_up" as NextBestAction, reason: "Submitted application has follow-up due" };
  }

  if (application.approval_state === "approved" && application.draft_state === "ready" && application.submission_state !== "submitted") {
    return { score: 34, action: "submit_application" as NextBestAction, reason: "Approved and ready for submission" };
  }

  if (application.approval_state === "approved" && application.draft_state !== "ready") {
    return { score: 22, action: "mark_ready" as NextBestAction, reason: "Approved application is not yet ready" };
  }

  if (application.draft_state === "drafted" && application.approval_state === "pending") {
    return {
      score: Number(job.total_score || 0) >= 80 ? 28 : 18,
      action: "approve_draft" as NextBestAction,
      reason: Number(job.total_score || 0) >= 80
        ? "Drafted high-score role needs approval review"
        : "Draft is waiting for review",
    };
  }

  if (application.draft_state === "ready" && application.approval_state === "pending") {
    return { score: 20, action: "review_draft" as NextBestAction, reason: "Ready draft is waiting on review" };
  }

  if (application.approval_state === "skipped") {
    return { score: -20, action: "no_action" as NextBestAction, reason: "Role already skipped" };
  }

  return { score: 0, action: "no_action" as NextBestAction, reason: "No immediate action required" };
}

export function prioritizeQueueItem(
  job: PrioritizableJobRecord,
  application?: DraftApplicationRecord | null,
): PrioritizedQueueState {
  const totalScore = Number(job.total_score || 0);
  const followUp = followUpPriority(application);
  const actionable = actionablePriority(job, application);

  let score = 0;
  score += recommendationWeight(job.recommendation);
  score += Math.round(totalScore * 0.45);
  score += actionable.score;
  score += followUp.score;
  score -= severeRiskPenalty(job.risk_flags || []);
  score -= stalePenalty(application);

  if (job.recommendation === "skip") {
    score -= 16;
  }

  if (application?.submission_state === "submitted" && application.outcome_state !== "none" && application.follow_up_status !== "due") {
    score -= 18;
  }

  return {
    queue_priority: bucketPriority(clampScore(score)),
    priority_score: clampScore(score),
    next_best_action: followUp.action || actionable.action,
    priority_reasoning: followUp.reason || actionable.reason,
  };
}

export function sortPrioritizedItems<T extends { priority_score: number; total_score: number; next_follow_up_at?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftDue = daysUntil(left.next_follow_up_at || "");
    const rightDue = daysUntil(right.next_follow_up_at || "");

    if (leftDue !== null && rightDue !== null && leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    return right.priority_score - left.priority_score || right.total_score - left.total_score;
  });
}

export function summarizeTopActionsDue(items: Array<PrioritizedQueueState>) {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.next_best_action, (counts.get(item.next_best_action) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([action, count]) => ({ action, count }));
}
