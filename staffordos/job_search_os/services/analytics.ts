import {
  fetchApplicationsByStatus,
  type DraftApplicationRecord,
} from "../db/applications_repo";
import {
  extractJobTitleKeywords,
  getJobScoreBand,
  type JobSearchRecommendation,
  type ScoredJobRecord as ScoredJobAnalyticsRecord,
} from "../db/jobs_repo";
import { prioritizeQueueItem, summarizeTopActionsDue } from "./prioritization";

type CountBreakdown = Record<string, number>;

export type PipelineMetrics = {
  total_jobs: number;
  pursue_count: number;
  stretch_pursue_count: number;
  skip_count: number;
  draft_count: number;
  approved_count: number;
  ready_count: number;
  submitted_count: number;
  follow_up_due_count: number;
  follow_up_sent_count: number;
  rejected_count: number;
  critical_count: number;
  high_count: number;
};

export type ConversionMetrics = {
  pursued_to_draft_rate: number;
  draft_to_approved_rate: number;
  approved_to_submitted_rate: number;
  submitted_to_followed_up_rate: number;
  submitted_to_interview_rate: number;
  submitted_to_rejection_rate: number;
};

export type ScoreBandEntry = {
  band: string;
  count: number;
  recommendation_mix: CountBreakdown;
  submitted_count: number;
  follow_up_count: number;
  outcome_mix: CountBreakdown;
};

export type RankedMetric = {
  key: string;
  count: number;
};

export type RoleAnalysis = {
  role_families: RankedMetric[];
  title_keywords: RankedMetric[];
  function_tags: RankedMetric[];
  domain_tags: RankedMetric[];
};

export type AngleAnalysis = {
  most_common_angles: RankedMetric[];
  submitted_angles: RankedMetric[];
  high_score_angles: RankedMetric[];
};

export type RiskFlagAnalysis = {
  most_common_risk_flags: RankedMetric[];
  skipped_risk_flags: RankedMetric[];
  stretch_risk_flags: RankedMetric[];
};

export type CurrentWorkSummary = {
  drafts_needing_review: number;
  approved_not_ready: number;
  ready_not_submitted: number;
  follow_ups_due_today: number;
  top_high_score_unreviewed_jobs: Array<{
    job_id: string;
    company: string;
    title: string;
    total_score: number;
    recommendation: JobSearchRecommendation;
  }>;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function countBy(items: string[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = cleanText(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function topCounts(items: string[], limit = 5): RankedMetric[] {
  return Array.from(countBy(items).entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function toRate(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function hasSubmitted(application: DraftApplicationRecord) {
  return application.submission_state === "submitted";
}

function hasFollowUp(activity: DraftApplicationRecord) {
  return activity.follow_up_state === "due" || activity.follow_up_state === "sent";
}

function isDueToday(value: string) {
  if (!value) return false;
  const today = new Date().toISOString().slice(0, 10);
  return cleanText(value).slice(0, 10) <= today;
}

export function buildPipelineMetrics(
  jobs: ScoredJobAnalyticsRecord[],
  applications: DraftApplicationRecord[],
): PipelineMetrics {
  return {
    total_jobs: jobs.length,
    pursue_count: jobs.filter((job) => job.recommendation === "pursue").length,
    stretch_pursue_count: jobs.filter((job) => job.recommendation === "stretch_pursue").length,
    skip_count: jobs.filter((job) => job.recommendation === "skip").length,
    draft_count: applications.filter((application) => application.draft_state === "drafted").length,
    approved_count: applications.filter((application) => application.approval_state === "approved").length,
    ready_count: applications.filter((application) => application.draft_state === "ready").length,
    submitted_count: applications.filter(hasSubmitted).length,
    follow_up_due_count: applications.filter((application) => application.follow_up_state === "due").length,
    follow_up_sent_count: applications.filter((application) => application.follow_up_state === "sent").length,
    rejected_count: applications.filter((application) => application.outcome_state === "rejected").length,
    critical_count: jobs.filter((job) => prioritizeQueueItem(job, applications.find((application) => application.job_id === job.id)).queue_priority === "critical").length,
    high_count: jobs.filter((job) => prioritizeQueueItem(job, applications.find((application) => application.job_id === job.id)).queue_priority === "high").length,
  };
}

export function buildConversionMetrics(
  jobs: ScoredJobAnalyticsRecord[],
  applications: DraftApplicationRecord[],
): ConversionMetrics {
  const pursuedCount = jobs.filter((job) => job.recommendation === "pursue" || job.recommendation === "stretch_pursue").length;
  const draftCount = applications.filter((application) => application.draft_state === "drafted" || application.draft_state === "ready").length;
  const approvedCount = applications.filter((application) => application.approval_state === "approved").length;
  const submittedCount = applications.filter(hasSubmitted).length;
  const followedUpCount = applications.filter(hasFollowUp).length;
  const interviewedCount = applications.filter((application) => application.outcome_state === "interview").length;
  const rejectedCount = applications.filter((application) => application.outcome_state === "rejected").length;

  return {
    pursued_to_draft_rate: toRate(draftCount, pursuedCount),
    draft_to_approved_rate: toRate(approvedCount, draftCount),
    approved_to_submitted_rate: toRate(submittedCount, approvedCount),
    submitted_to_followed_up_rate: toRate(followedUpCount, submittedCount),
    submitted_to_interview_rate: toRate(interviewedCount, submittedCount),
    submitted_to_rejection_rate: toRate(rejectedCount, submittedCount),
  };
}

export function buildScoreBandAnalysis(
  jobs: ScoredJobAnalyticsRecord[],
  applications: DraftApplicationRecord[],
): ScoreBandEntry[] {
  const applicationByJobId = new Map(applications.map((application) => [application.job_id, application]));
  const bands = ["90-100", "80-89", "70-79", "below_70"];

  return bands.map((band) => {
    const jobsInBand = jobs.filter((job) => getJobScoreBand(Number(job.total_score || 0)) === band);
    const recommendationMix = Object.fromEntries(
      ["pursue", "stretch_pursue", "skip"].map((recommendation) => [
        recommendation,
        jobsInBand.filter((job) => job.recommendation === recommendation).length,
      ]),
    );
    const applicationsInBand = jobsInBand
      .map((job) => applicationByJobId.get(job.id))
      .filter((application): application is DraftApplicationRecord => Boolean(application));

    const outcomeMix = Object.fromEntries(
      ["none", "interview", "rejected"].map((outcome) => [
        outcome,
        applicationsInBand.filter((application) => application.outcome_state === outcome).length,
      ]),
    );

    return {
      band,
      count: jobsInBand.length,
      recommendation_mix: recommendationMix,
      submitted_count: applicationsInBand.filter(hasSubmitted).length,
      follow_up_count: applicationsInBand.filter(hasFollowUp).length,
      outcome_mix: outcomeMix,
    };
  });
}

export function buildRoleAnalysis(
  jobs: ScoredJobAnalyticsRecord[],
  applications: DraftApplicationRecord[],
): RoleAnalysis {
  const submittedJobIds = new Set(applications.filter(hasSubmitted).map((application) => application.job_id));
  const pursuedJobs = jobs.filter((job) => job.recommendation === "pursue" || job.recommendation === "stretch_pursue");
  const submittedJobs = jobs.filter((job) => submittedJobIds.has(job.id));
  const promisingJobs = pursuedJobs.length ? pursuedJobs : submittedJobs;

  return {
    role_families: topCounts(promisingJobs.map((job) => cleanText(job.role_family))),
    title_keywords: topCounts(promisingJobs.flatMap((job) => extractJobTitleKeywords(job.title))),
    function_tags: topCounts(promisingJobs.flatMap((job) => job.function_tags || [])),
    domain_tags: topCounts(promisingJobs.flatMap((job) => job.domain_tags || [])),
  };
}

export function buildAngleAnalysis(
  jobs: ScoredJobAnalyticsRecord[],
  applications: DraftApplicationRecord[],
): AngleAnalysis {
  const pursuedJobs = jobs.filter((job) => job.recommendation === "pursue" || job.recommendation === "stretch_pursue");
  const submittedApplications = applications.filter(hasSubmitted);
  const submittedJobIds = new Set(submittedApplications.map((application) => application.job_id));
  const submittedJobs = jobs.filter((job) => submittedJobIds.has(job.id));
  const highScoreJobs = jobs.filter((job) => Number(job.total_score || 0) >= 80);

  return {
    most_common_angles: topCounts(pursuedJobs.flatMap((job) => job.strongest_angles || [])),
    submitted_angles: topCounts(submittedJobs.flatMap((job) => job.strongest_angles || [])),
    high_score_angles: topCounts(highScoreJobs.flatMap((job) => job.strongest_angles || [])),
  };
}

export function buildRiskFlagAnalysis(jobs: ScoredJobAnalyticsRecord[]): RiskFlagAnalysis {
  return {
    most_common_risk_flags: topCounts(jobs.flatMap((job) => job.risk_flags || [])),
    skipped_risk_flags: topCounts(
      jobs.filter((job) => job.recommendation === "skip").flatMap((job) => job.risk_flags || []),
    ),
    stretch_risk_flags: topCounts(
      jobs.filter((job) => job.recommendation === "stretch_pursue").flatMap((job) => job.risk_flags || []),
    ),
  };
}

export function buildCurrentWorkSummary(
  jobs: ScoredJobAnalyticsRecord[],
  applications: DraftApplicationRecord[],
): CurrentWorkSummary {
  const applicationJobIds = new Set(applications.map((application) => application.job_id));
  const topHighScoreUnreviewedJobs = jobs
    .filter((job) =>
      Number(job.total_score || 0) >= 80
      && (job.recommendation === "pursue" || job.recommendation === "stretch_pursue")
      && !applicationJobIds.has(job.id)
    )
    .sort((left, right) => Number(right.total_score || 0) - Number(left.total_score || 0))
    .slice(0, 5)
    .map((job) => ({
      job_id: job.id,
      company: job.company,
      title: job.title,
      total_score: Number(job.total_score || 0),
      recommendation: job.recommendation || "skip",
    }));

  return {
    drafts_needing_review: applications.filter((application) => application.draft_state === "drafted" && application.approval_state === "pending").length,
    approved_not_ready: applications.filter((application) => application.approval_state === "approved" && application.draft_state !== "ready").length,
    ready_not_submitted: applications.filter((application) => application.draft_state === "ready" && !hasSubmitted(application)).length,
    follow_ups_due_today: applications.filter((application) =>
      application.follow_up_state === "due" || isDueToday(application.next_follow_up_at)
    ).length,
    top_high_score_unreviewed_jobs: topHighScoreUnreviewedJobs,
  };
}

export function buildJobAnalytics(jobs: ScoredJobAnalyticsRecord[], applications: DraftApplicationRecord[]) {
  return {
    pipeline_metrics: buildPipelineMetrics(jobs, applications),
    score_bands: buildScoreBandAnalysis(jobs, applications),
    role_analysis: buildRoleAnalysis(jobs, applications),
    angle_analysis: buildAngleAnalysis(jobs, applications),
    risk_analysis: buildRiskFlagAnalysis(jobs),
  };
}

export function buildApplicationAnalytics(jobs: ScoredJobAnalyticsRecord[], applications: DraftApplicationRecord[]) {
  return {
    pipeline_metrics: buildPipelineMetrics(jobs, applications),
    conversion_metrics: buildConversionMetrics(jobs, applications),
    applications_by_approval_state: {
      pending: fetchApplicationsByStatus(applications, "pending").length,
      approved: fetchApplicationsByStatus(applications, "approved").length,
      skipped: fetchApplicationsByStatus(applications, "skipped").length,
    },
    applications_by_draft_state: {
      not_started: fetchApplicationsByStatus(applications, "not_started").length,
      drafted: fetchApplicationsByStatus(applications, "drafted").length,
      ready: fetchApplicationsByStatus(applications, "ready").length,
    },
    applications_by_submission_state: {
      not_submitted: fetchApplicationsByStatus(applications, "not_submitted").length,
      submitted: fetchApplicationsByStatus(applications, "submitted").length,
    },
  };
}

export function buildAnalyticsSummary(jobs: ScoredJobAnalyticsRecord[], applications: DraftApplicationRecord[]) {
  const prioritized = jobs.map((job) => prioritizeQueueItem(job, applications.find((application) => application.job_id === job.id)));
  return {
    pipeline_metrics: buildPipelineMetrics(jobs, applications),
    conversion_metrics: buildConversionMetrics(jobs, applications),
    current_work_summary: buildCurrentWorkSummary(jobs, applications),
    top_role_families: buildRoleAnalysis(jobs, applications).role_families,
    top_strongest_angles: buildAngleAnalysis(jobs, applications).most_common_angles,
    top_risk_flags: buildRiskFlagAnalysis(jobs).most_common_risk_flags,
    top_actions_due: summarizeTopActionsDue(prioritized),
  };
}
