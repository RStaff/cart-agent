import { JOB_SEARCH_OS_MODULE_ID, JOB_SEARCH_OS_PLACEHOLDER_MESSAGE } from "../config";

export async function handleResumeRoute() {
  return Response.json({
    ok: false,
    module: JOB_SEARCH_OS_MODULE_ID,
    endpoint: "resume",
    status: JOB_SEARCH_OS_PLACEHOLDER_MESSAGE,
  }, { status: 501 });
}
