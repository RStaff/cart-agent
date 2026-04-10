import { JOB_SEARCH_OS_MODULE_ID } from "../config";
import { readCanonicalApplicationsState } from "../db/applications_repo";
import { buildJobAnalytics } from "../services/analytics";
import { readReviewState } from "../services/review_state";

export async function handleJobsRoute(
  request: Request,
  pathSegments: string[] = [],
) {
  if (request.method !== "GET") {
    return Response.json({
      ok: false,
      module: JOB_SEARCH_OS_MODULE_ID,
      endpoint: "jobs",
      status: "method_not_allowed",
    }, { status: 405 });
  }

  const routeKey = String(pathSegments[0] || "").trim().toLowerCase();
  const reviewState = readReviewState();

  if (routeKey === "analytics") {
    return Response.json({
      ok: true,
      module: JOB_SEARCH_OS_MODULE_ID,
      endpoint: "jobs.analytics",
      analytics: buildJobAnalytics(reviewState.jobs, readCanonicalApplicationsState()),
    });
  }

  return Response.json({
    ok: true,
    module: JOB_SEARCH_OS_MODULE_ID,
    endpoint: "jobs",
    jobs: reviewState.jobs,
  });
}
