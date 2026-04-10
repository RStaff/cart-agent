import { dispatchJobSearchRoute } from "../../../../../../job_search_os/routes/http";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

async function handleRequest(_: Request, context: RouteContext) {
  const params = await context.params;
  return dispatchJobSearchRoute(_, params.path || []);
}

export async function GET(request: Request, context: RouteContext) {
  return handleRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleRequest(request, context);
}
