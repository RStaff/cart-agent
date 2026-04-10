import { JOB_SEARCH_OS_MODULE_ID } from "../config";
import { handleAnalyticsRoute } from "./analytics";
import { handleApplicationsRoute } from "./applications";
import { handleJobsRoute } from "./jobs";
import { handleQueueRoute } from "./queue";
import { handleResumeRoute } from "./resume";

type RouteHandler = (request: Request, pathSegments: string[]) => Promise<Response>;

const ROUTE_HANDLERS: Record<string, RouteHandler> = {
  analytics: (request, pathSegments) => handleAnalyticsRoute(request, pathSegments),
  applications: (request, pathSegments) => handleApplicationsRoute(request, pathSegments),
  jobs: (request, pathSegments) => handleJobsRoute(request, pathSegments),
  queue: (request) => handleQueueRoute(request),
  resume: () => handleResumeRoute(),
};

export async function dispatchJobSearchRoute(request: Request, pathSegments: string[] = []) {
  const routeKey = String(pathSegments[0] || "").trim().toLowerCase();
  const handler = ROUTE_HANDLERS[routeKey];

  if (!handler) {
    return Response.json({
      ok: false,
      module: JOB_SEARCH_OS_MODULE_ID,
      endpoint: routeKey || "unknown",
      status: "not_found",
    }, { status: 404 });
  }

  return handler(request, pathSegments.slice(1));
}
