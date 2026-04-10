import { JOB_SEARCH_OS_MODULE_ID } from "../config";
import {
  APPLICATION_QUEUE_GROUPS,
  type ApplicationQueueGroup,
  type DraftApplicationRecord,
  readCanonicalApplicationsState,
  saveCanonicalApplication,
} from "../db/applications_repo";
import type { JobScoreRecord, NormalizedJobRecord } from "../db/jobs_repo";
import {
  applyQueueAction,
  buildQueueGroups,
  filterQueueRecords,
  type ScoredJobRecord,
} from "../services/tracker";
import { readReviewState } from "../services/review_state";

type QueueRouteContext = {
  jobs?: ScoredJobRecord[];
  applications?: DraftApplicationRecord[];
};

type QueueActionPayload = {
  action?: string;
  job_id?: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanQueueGroup(value: unknown): ApplicationQueueGroup | "" {
  const normalized = cleanText(value).toLowerCase();
  return APPLICATION_QUEUE_GROUPS.includes(normalized as ApplicationQueueGroup)
    ? (normalized as ApplicationQueueGroup)
    : "";
}

function ensureScoredJobs(
  jobs: Array<NormalizedJobRecord & Partial<JobScoreRecord>>,
): ScoredJobRecord[] {
  return jobs
    .filter((job) => typeof job.total_score === "number" && !!job.recommendation)
    .map((job) => job as ScoredJobRecord);
}

export async function handleQueueRoute(
  request: Request,
  context: QueueRouteContext = {},
) {
  const reviewState = !context.jobs ? readReviewState() : null;
  const jobs = ensureScoredJobs(context.jobs || reviewState?.jobs || []);
  const applications = context.applications || readCanonicalApplicationsState();

  if (request.method === "GET") {
    const url = new URL(request.url);
    const group = cleanQueueGroup(url.searchParams.get("group"));

    if (group) {
      return Response.json({
        ok: true,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "queue",
        group,
        items: filterQueueRecords(jobs, applications, group),
      });
    }

    return Response.json({
      ok: true,
      module: JOB_SEARCH_OS_MODULE_ID,
      endpoint: "queue",
      groups: buildQueueGroups(jobs, applications),
    });
  }

  if (request.method === "POST") {
    const payload = await request.json().catch(() => ({} as QueueActionPayload));
    const action = cleanText(payload.action).toLowerCase();
    const jobId = cleanText(payload.job_id);

    if (!["approve", "skip", "mark_draft_ready"].includes(action) || !jobId) {
      return Response.json({
        ok: false,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "queue",
        status: "invalid_action_payload",
      }, { status: 400 });
    }

    try {
      const updatedApplication = applyQueueAction(applications, {
        action: action as "approve" | "skip" | "mark_draft_ready",
        job_id: jobId,
      });
      const saved = saveCanonicalApplication(updatedApplication);

      return Response.json({
        ok: true,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "queue",
        action,
        application: saved,
      });
    } catch (error) {
      return Response.json({
        ok: false,
        module: JOB_SEARCH_OS_MODULE_ID,
        endpoint: "queue",
        status: error instanceof Error ? error.message : "queue_action_failed",
      }, { status: 400 });
    }
  }

  return Response.json({
    ok: false,
    module: JOB_SEARCH_OS_MODULE_ID,
    endpoint: "queue",
    status: "method_not_allowed",
  }, { status: 405 });
}
