import { JOB_SEARCH_OS_MODULE_ID } from "../config";
import { readCanonicalApplicationsState } from "../db/applications_repo";
import { buildAnalyticsSummary } from "../services/analytics";
import { readReviewState } from "../services/review_state";

export async function handleAnalyticsRoute(
  request: Request,
  pathSegments: string[] = [],
) {
  if (request.method !== "GET") {
    return Response.json({
      ok: false,
      module: JOB_SEARCH_OS_MODULE_ID,
      endpoint: "analytics",
      status: "method_not_allowed",
    }, { status: 405 });
  }

  const routeKey = String(pathSegments[0] || "").trim().toLowerCase();
  const reviewState = readReviewState();
  const applications = readCanonicalApplicationsState();

  if (routeKey !== "summary") {
    return Response.json({
      ok: false,
      module: JOB_SEARCH_OS_MODULE_ID,
      endpoint: "analytics",
      status: "not_found",
    }, { status: 404 });
  }

  return Response.json({
    ok: true,
    module: JOB_SEARCH_OS_MODULE_ID,
    endpoint: "analytics.summary",
    summary: buildAnalyticsSummary(reviewState.jobs, applications),
  });
}
