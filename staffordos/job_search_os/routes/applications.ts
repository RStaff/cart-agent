import { JOB_SEARCH_OS_MODULE_ID } from "../config";
import type { DraftApplicationRecord } from "../db/applications_repo";
import {
  fetchApplicationByJobId,
  markApplicationFollowUpSent,
  markApplicationSubmitted,
  readCanonicalApplicationsState,
  saveCanonicalApplication,
  skipApplicationFollowUp,
  snoozeApplicationFollowUp,
} from "../db/applications_repo";
import type { CandidateProfileRecord } from "../db/candidate_profile_repo";
import type { ResumeBlockRecord } from "../db/resume_blocks_repo";
import type { JobScoreRecord, NormalizedJobRecord } from "../db/jobs_repo";
import {
  buildApplicationsIndex,
  createDraftApplicationArtifact,
  updateDraftApplicationNotesForJob,
  type ScoredJobRecord,
} from "../services/tracker";
import { buildApplicationAnalytics } from "../services/analytics";
import { generateFollowUpDraft, resolveFollowUpStatus } from "../services/followups";
import { prioritizeQueueItem, sortPrioritizedItems } from "../services/prioritization";
import { readReviewState } from "../services/review_state";

type ApplicationsRouteContext = {
  jobs?: ScoredJobRecord[];
  applications?: DraftApplicationRecord[];
  canonicalResumeMarkdown?: string;
  candidateProfile?: CandidateProfileRecord | null;
  resumeBlocks?: ResumeBlockRecord[];
};

type CreateDraftPayload = {
  job_id?: string;
  notes?: string;
  business_days?: number;
  days?: number;
  note?: string;
  submitted_at?: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanPositiveInteger(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.floor(numeric);
}

function ensureScoredJobs(
  jobs: Array<NormalizedJobRecord & Partial<JobScoreRecord>>,
): ScoredJobRecord[] {
  return jobs
    .filter((job) => typeof job.total_score === "number" && !!job.recommendation)
    .map((job) => job as ScoredJobRecord);
}

function buildFollowUpPayload(application: DraftApplicationRecord) {
  return {
    job_id: application.job_id,
    submitted_at: application.submitted_at,
    next_follow_up_at: application.next_follow_up_at,
    last_follow_up_at: application.last_follow_up_at,
    follow_up_count: application.follow_up_count,
    follow_up_status: resolveFollowUpStatus(application),
    follow_up_history_json: application.follow_up_history_json,
    last_contact_type: application.last_contact_type,
  };
}

function notFoundResponse() {
  return Response.json({
    ok: false,
    module: JOB_SEARCH_OS_MODULE_ID,
    endpoint: "applications",
    status: "application_not_found",
  }, { status: 404 });
}

function buildFallbackScoredJob(application: DraftApplicationRecord): ScoredJobRecord {
  return {
    id: application.job_id,
    source: "manual",
    source_url: "",
    title: application.title,
    company: application.company,
    location_text: "",
    work_mode: "",
    employment_type: "",
    salary_min: null,
    salary_max: null,
    salary_currency: "",
    description_raw: "",
    description_normalized: "",
    role_family: "",
    seniority_hint: "",
    seniority: "",
    domain_tags: [],
    function_tags: [],
    tools: [],
    requires_people_management: false,
    company_quality: "",
    strategic_upside: "",
    fit_score: 0,
    compensation_score: 0,
    narrative_score: 0,
    total_score: 0,
    recommendation: application.recommendation,
    score_reasoning: application.score_reasoning,
    risk_flags: application.risk_flags,
    strongest_angles: application.strongest_angles,
  };
}

function buildApplicationPriority(
  jobs: ScoredJobRecord[],
  application: DraftApplicationRecord,
) {
  return prioritizeQueueItem(
    jobs.find((candidate) => candidate.id === application.job_id) || buildFallbackScoredJob(application),
    application,
  );
}

function resolveApplicationJobScore(
  jobs: ScoredJobRecord[],
  application: DraftApplicationRecord,
) {
  return Number(
    jobs.find((candidate) => candidate.id === application.job_id)?.total_score || 0,
  );
}

export async function handleApplicationsRoute(
  request: Request,
  pathSegments: string[] = [],
  context: ApplicationsRouteContext = {},
) {
  const persistedState = (
    !context.jobs
    && !context.canonicalResumeMarkdown
    && !context.candidateProfile
    && !context.resumeBlocks
  ) ? readReviewState() : null;
  const jobs = ensureScoredJobs(context.jobs || persistedState?.jobs || []);
  const applications = context.applications || readCanonicalApplicationsState();
  const canonicalResumeMarkdown = context.canonicalResumeMarkdown || persistedState?.canonicalResumeMarkdown || "";
  const candidateProfile = context.candidateProfile || persistedState?.candidateProfile || null;
  const resumeBlocks = context.resumeBlocks || persistedState?.resumeBlocks || [];
  const jobIdFromPath = cleanText(pathSegments[0]);
  const subresource = cleanText(pathSegments[1]).toLowerCase();
  const action = cleanText(pathSegments[2]).toLowerCase();

  if (request.method === "GET") {
    if (jobIdFromPath === "analytics") {
      return Response.json({
        ok: true,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "applications.analytics",
        analytics: buildApplicationAnalytics(jobs, applications),
      });
    }

    if (jobIdFromPath && subresource === "followup") {
      const application = fetchApplicationByJobId(applications, jobIdFromPath);

      if (!application) {
        return notFoundResponse();
      }

      return Response.json({
        ok: true,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "applications",
        application,
        priority: buildApplicationPriority(jobs, application),
        follow_up: buildFollowUpPayload(application),
      });
    }

    if (jobIdFromPath) {
      const application = fetchApplicationByJobId(applications, jobIdFromPath);

      if (!application) {
        return notFoundResponse();
      }

      return Response.json({
        ok: true,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "applications",
        application,
        priority: buildApplicationPriority(jobs, application),
      });
    }

    const prioritizedApplications = sortPrioritizedItems(applications.map((application) => ({
      ...application,
      total_score: resolveApplicationJobScore(jobs, application),
      ...buildApplicationPriority(jobs, application),
    })));

    return Response.json({
      ok: true,
      module: JOB_SEARCH_OS_MODULE_ID,
      endpoint: "applications",
      applications,
      index: buildApplicationsIndex(applications),
      prioritized_applications: prioritizedApplications,
    });
  }

  if (request.method === "POST") {
    const payload = await request.json().catch(() => ({} as CreateDraftPayload));
    const jobId = cleanText(payload.job_id) || jobIdFromPath;

    if (!jobId) {
      return Response.json({
        ok: false,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "applications",
        status: "job_id_required",
      }, { status: 400 });
    }

    if (subresource === "notes") {
      try {
        const updated = updateDraftApplicationNotesForJob(applications, jobId, cleanText(payload.notes));
        const saved = saveCanonicalApplication(updated);

        return Response.json({
          ok: true,
          module: JOB_SEARCH_OS_MODULE_ID,
          endpoint: "applications",
          application: saved,
          priority: buildApplicationPriority(jobs, saved),
        });
      } catch (error) {
        return Response.json({
          ok: false,
          module: JOB_SEARCH_OS_MODULE_ID,
          endpoint: "applications",
          status: error instanceof Error ? error.message : "application_notes_update_failed",
        }, { status: 400 });
      }
    }

    if (subresource === "submit") {
      const application = fetchApplicationByJobId(applications, jobId);

      if (!application) {
        return notFoundResponse();
      }

      try {
        const saved = saveCanonicalApplication(
          markApplicationSubmitted(application, cleanText(payload.submitted_at) || undefined),
        );

        return Response.json({
          ok: true,
          module: JOB_SEARCH_OS_MODULE_ID,
          endpoint: "applications",
          application: saved,
          priority: buildApplicationPriority(jobs, saved),
          follow_up: buildFollowUpPayload(saved),
        });
      } catch (error) {
        return Response.json({
          ok: false,
          module: JOB_SEARCH_OS_MODULE_ID,
          endpoint: "applications",
          status: error instanceof Error ? error.message : "application_submit_failed",
        }, { status: 400 });
      }
    }

    if (subresource === "followup") {
      const application = fetchApplicationByJobId(applications, jobId);

      if (!application) {
        return notFoundResponse();
      }

      try {
        if (!action) {
          throw new Error("follow_up_action_required");
        }

        if (action === "generate") {
          const draft = generateFollowUpDraft(application);
          return Response.json({
            ok: true,
            module: JOB_SEARCH_OS_MODULE_ID,
            endpoint: "applications",
            application,
            priority: buildApplicationPriority(jobs, application),
            follow_up: buildFollowUpPayload(application),
            draft,
          });
        }

        if (action === "mark-sent") {
          const saved = saveCanonicalApplication(
            markApplicationFollowUpSent(application, cleanText(payload.note)),
          );
          return Response.json({
            ok: true,
            module: JOB_SEARCH_OS_MODULE_ID,
            endpoint: "applications",
            application: saved,
            priority: buildApplicationPriority(jobs, saved),
            follow_up: buildFollowUpPayload(saved),
          });
        }

        if (action === "snooze") {
          const saved = saveCanonicalApplication(
            snoozeApplicationFollowUp(
              application,
              cleanPositiveInteger(payload.business_days ?? payload.days, 3),
              cleanText(payload.note),
            ),
          );
          return Response.json({
            ok: true,
            module: JOB_SEARCH_OS_MODULE_ID,
            endpoint: "applications",
            application: saved,
            priority: buildApplicationPriority(jobs, saved),
            follow_up: buildFollowUpPayload(saved),
          });
        }

        if (action === "skip") {
          const saved = saveCanonicalApplication(
            skipApplicationFollowUp(application, cleanText(payload.note)),
          );
          return Response.json({
            ok: true,
            module: JOB_SEARCH_OS_MODULE_ID,
            endpoint: "applications",
            application: saved,
            priority: buildApplicationPriority(jobs, saved),
            follow_up: buildFollowUpPayload(saved),
          });
        }

        throw new Error("follow_up_action_not_supported");
      } catch (error) {
        return Response.json({
          ok: false,
          module: JOB_SEARCH_OS_MODULE_ID,
          endpoint: "applications",
          status: error instanceof Error ? error.message : "follow_up_action_failed",
        }, { status: 400 });
      }
    }

    const job = jobs.find((candidate) => candidate.id === jobId);

    if (!job) {
      return Response.json({
        ok: false,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "applications",
        status: "scored_job_not_found",
      }, { status: 404 });
    }

    if (!canonicalResumeMarkdown || !candidateProfile) {
      return Response.json({
        ok: false,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "applications",
        status: "tailoring_context_missing",
      }, { status: 400 });
    }

    try {
      const draft = createDraftApplicationArtifact({
        job,
        applications,
        canonicalResumeMarkdown,
        candidateProfile,
        resumeBlocks,
      });
      saveCanonicalApplication(draft.application);

      return Response.json({
        ok: true,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "applications",
        draft,
        priority: buildApplicationPriority(jobs, draft.application),
      });
    } catch (error) {
      return Response.json({
        ok: false,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "applications",
        status: error instanceof Error ? error.message : "draft_creation_failed",
      }, { status: 400 });
    }
  }

  return Response.json({
    ok: false,
    module: JOB_SEARCH_OS_MODULE_ID,
    endpoint: "applications",
    status: "method_not_allowed",
  }, { status: 405 });
}
